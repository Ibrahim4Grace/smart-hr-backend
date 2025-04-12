import { InjectRepository } from '@nestjs/typeorm';
import { HttpStatus, Injectable, HttpException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { User } from './entities/user.entity';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { UserRole } from './enum/user.role';
import { EmailService } from '@modules/email/email.service';
import { Logger } from '@nestjs/common';
import { timestamp } from '@utils/time';
import {
  UserResponseDTO,
  PaginatedUsersResponse,
  UpdateUserResponseDTO,
  UpdateUserDto,
  DeleteUserResponse,
  DeactivateAccountDto,
  ReactivateAccountDto,
} from './dto/create-user.dto';
import {
  UserPayload,
  UpdateUserRecordOption,
  CreateNewUserOptions,
  UserIdentifierOptionsType,
} from './interface/user.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  async getUserRecord(identifierOptions: UserIdentifierOptionsType) {
    const { identifier, identifierType } = identifierOptions;

    const GetRecord = {
      id: async () => this.getUserById(String(identifier)),
      email: async () => this.getUserByEmail(String(identifier)),
    };
    return await GetRecord[identifierType]();
  }

  private async getUserByEmail(email: string) {
    const user: UserResponseDTO = await this.userRepository.findOne({
      where: { email },
    });
    return user;
  }

  private async getUserById(userId: string) {
    const user: UserResponseDTO = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    return user;
  }

  async updateUserRecord(userUpdateOptions: UpdateUserRecordOption) {
    const { updatePayload, identifierOptions } = userUpdateOptions;
    const user = await this.getUserRecord(identifierOptions);
    Object.assign(user, updatePayload);
    await this.userRepository.save(user);
  }

  async create(createUserPayload: CreateNewUserOptions, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    const hashedPassword = await this.passwordService.hashPassword(createUserPayload.password);
    const newUser = repo.create({ ...createUserPayload, password: hashedPassword });
    return repo.save(newUser);
  }

  async findAll(page: number = 1, limit: number = 10, currentUser: UserPayload): Promise<PaginatedUsersResponse> {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'name', 'email', 'phone', 'is_active', 'created_at'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const pagination = {
      current_page: page,
      total_pages: Math.ceil(total / limit),
      total_users: total,
    };

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      role: user.role,
      created_at: user.created_at,
    }));

    return {
      status: 'success',
      message: 'Users retrieved successfully',
      data: {
        users: formattedUsers,
        pagination,
      },
    };
  }

  async findOne(userId: string) {
    const user = await this.getUserRecord({ identifier: userId, identifierType: 'id' });
    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const { password, ...userData } = user;

    return {
      status_code: 200,
      user: userData,
    };
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    currentUser?: UserPayload,
  ): Promise<UpdateUserResponseDTO> {
    if (!userId) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const identifierOptions: UserIdentifierOptionsType = {
      identifierType: 'id',
      identifier: userId,
    };
    const user = await this.getUserRecord(identifierOptions);
    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    // TODO: CHECK IF USER IS AN ADMIN
    if (currentUser && currentUser.userId !== userId) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'You are not authorized to update this user',
        status_code: HttpStatus.FORBIDDEN,
      });
    }

    try {
      if (currentUser?.role !== 'admin' && updateUserDto.role) {
        delete updateUserDto.role;
      }

      Object.assign(user, updateUserDto);
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'Failed to update user',
        status_code: HttpStatus.BAD_REQUEST,
      });
    }

    return {
      status: 'success',
      message: 'User Updated Successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    };
  }

  async remove(userId: string, currentUser?: UserPayload): Promise<DeleteUserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'subscriptions'],
    });
    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (currentUser.userId === userId) throw new ForbiddenException('You cannot delete your own account');

    if (user.role === UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can delete other admins');
    }

    await this.userRepository.remove(user);

    return {
      status: 'success',
      message: 'User deleted successfully',
    };
  }

  async deactivateUser(adminName: string, deactivateDto: DeactivateAccountDto): Promise<DeleteUserResponse> {
    const user = await this.userRepository.findOne({
      where: { email: deactivateDto.email },
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);

    if (!user.is_active) {
      throw new CustomHttpException(SYS_MSG.USER_DEACTIVATED, HttpStatus.BAD_REQUEST);
    }

    user.status = false;
    user.deactivation_reason = deactivateDto.reason;
    user.deactivated_by = adminName;
    user.deactivated_at = new Date();
    await this.userRepository.save(user);

    try {
      await this.emailService.sendDeactivationNotification(user.email, user.name, timestamp, {
        reason: deactivateDto.reason,
        admin: adminName,
      });
      this.logger.log(`Successfully sent deactivation email to ${user.email} for user ${user.name}`);
    } catch (emailError) {
      this.logger.error('Error sending confirmation email:', emailError);
    }

    return {
      status: 'success',
      message: 'User deactivated successfully',
    };
  }

  async reactivateUser(adminEmail: string, reactivateDto: ReactivateAccountDto): Promise<DeleteUserResponse> {
    const user = await this.userRepository.findOne({
      where: { email: reactivateDto.email },
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (user.status) throw new CustomHttpException(SYS_MSG.USER_ACTIVATEED, HttpStatus.NOT_FOUND);

    user.status = true;
    user.reactivation_reason = reactivateDto.reason;
    user.reactivated_by = adminEmail;
    user.reactivated_at = new Date();
    await this.userRepository.save(user);

    try {
      await this.emailService.sendReactivationNotification(user.email, user.name, timestamp, {
        reason: reactivateDto.reason,
        admin: adminEmail,
      });
    } catch (emailError) {
      this.logger.error('Error sending confirmation email:', emailError);
    }

    return {
      status: 'success',
      message: 'User reactivated successfully',
    };
  }

  // async getUserDataWithoutPasswordById(id: string) {
  //   const user = await this.getUserRecord({ identifier: id, identifierType: 'id' });
  //   if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

  //   const { password, ...userData } = user;

  //   return {
  //     status_code: 200,
  //     user: userData,
  //   };
  // }

  // async getUserDataWithoutPassword(userId: string, requestingUserId: string) {
  //   const user = await this.getUserRecord({ identifier: userId, identifierType: 'id' });
  //   if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

  //   if (user.id !== requestingUserId) {
  //     throw new CustomHttpException(SYS_MSG.ACCESS_DENIED_USER_PROFILE, HttpStatus.FORBIDDEN);
  //   }

  //   const { password, ...userData } = user;

  //   return {
  //     status_code: 200,
  //     user: userData,
  //   };
  // }
}
