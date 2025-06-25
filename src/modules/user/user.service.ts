import { InjectRepository } from '@nestjs/typeorm';
import { HttpStatus, Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { User } from './entities/user.entity';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { EmailQueueService } from '@modules/email-queue/email-queue.service';
import { Logger } from '@nestjs/common';
import { timestamp } from '@utils/time';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { UploadUserProfilePicDto } from './dto/upload-profile-pic.dto';
import { PROFILE_PHOTO_UPLOADS } from '@shared/constants/SystemMessages';
import { pipeline, Readable } from 'stream';
import {
  UserResponseDTO,
  PaginatedUsersResponse,
  UpdateUserResponseDTO,
  UpdateUserDto,
  DeleteUserResponse,
} from './dto/create-user.dto';
import {
  UserPayload,
  UpdateUserRecordOption,
  CreateNewUserOptions,
  UserIdentifierOptionsType,
} from './interface/user.interface';
import { CloudinaryService } from '@shared/services/cloudinary.service';
import { PaginationService } from '@shared/services/pagination.service';
import { FindOptionsOrder } from 'typeorm';
import { EntityPermissionsService } from '@shared/services/permissions.service';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { CacheService } from '@shared/cache/cache.service';
import { CachePrefixesService } from '@shared/cache/cache.prefixes.service';
import { Employee } from '@modules/employee/entities/employee.entity';
import { CreateEmployeeDto } from '@modules/employee/dto/create-employee.dto';
import { ChangePasswordDto } from '@modules/employee/dto/change-password.dto';


@Injectable()
export class UserService {
  private uploadsDir: string;
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    private passwordService: PasswordService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly paginationService: PaginationService,
    private cacheService: CacheService,
    private cachePrefixes: CachePrefixesService,
    private readonly permissionsService: EntityPermissionsService,
    private emailQueueService: EmailQueueService,

  ) {
    this.uploadsDir = PROFILE_PHOTO_UPLOADS;
  }

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
      where: { id: userId }
    });
    return user;
  }

  async getUserDataWithoutPasswordById(id: string) {
    const user = await this.getUserRecord({ identifier: id, identifierType: 'id' });
    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const { password, ...userData } = user;

    return {
      status_code: 200,
      user: userData,
    };
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

  async createEmployee(createEmployeeDto: CreateEmployeeDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const { email, phone_number, ...rest } = createEmployeeDto;

    const existingEmployee = await this.employeeRepository.findOne({
      where: [{ email }, { phone_number }],
    });

    if (existingEmployee) {
      throw new BadRequestException('Employee with this email or phone number already exists.');
    }
    const plainPassword = createEmployeeDto.password;
    const hashedPassword = await this.passwordService.hashPassword(createEmployeeDto.password);

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      password: hashedPassword,
      added_by_hr: user,
    });

    try {
      const savedEmployee = await this.employeeRepository.save(employee);

      await this.emailQueueService.sendEmployeeOnboardingEmail(
        savedEmployee.email,
        savedEmployee.first_name,
        savedEmployee.last_name,
        plainPassword,
        savedEmployee.company
      );

      await this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE);

      return savedEmployee;
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create employee');
    }
  }

  async findEmployeesByHR(hrId: string, paginationOptions: PaginationOptions<Employee>) {
    return this.cacheService.getOrSet(
      this.cachePrefixes.EMPLOYEE_LIST,
      `hr:${hrId}:${JSON.stringify(paginationOptions)}`,
      async () => {
        const hr = await this.userRepository.findOne({
          where: { id: hrId, role: UserRole.HR }
        });

        if (!hr) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

        return this.paginationService.paginate(
          this.employeeRepository,
          { added_by_hr: { id: hrId } },
          {
            ...paginationOptions,
            relations: ['added_by_hr']
          }
        );
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  async findEmployeeById(employeeId: string, hrId: string) {
    return this.cacheService.getOrSet(
      this.cachePrefixes.EMPLOYEE_BY_ID,
      `hr:${hrId}:employee:${employeeId}`,
      async () => {
        const hr = await this.userRepository.findOne({
          where: { id: hrId, role: UserRole.HR }
        });

        if (!hr) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

        const employee = await this.employeeRepository.findOne({
          where: {
            id: employeeId,
            added_by_hr: { id: hrId }
          },
          relations: ['added_by_hr']
        });

        if (!employee) throw new CustomHttpException(SYS_MSG.EMPLOYEE_NOT_FOUND, HttpStatus.NOT_FOUND);

        return {
          status_code: 200,
          employee
        };
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  async getHRInfo(hrId: string) {
    return this.cacheService.getOrSet(
      this.cachePrefixes.USER_BY_ID,
      `hr:${hrId}`,
      async () => {
        const hr = await this.userRepository.findOne({
          where: { id: hrId, role: UserRole.HR }
        });

        if (!hr) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        return {
          status_code: 200,
          hr
        };
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string
  ): Promise<UpdateUserResponseDTO> {
    if (!userId) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const user = await this.permissionsService.getUserById(userId);

    if (user.id !== currentUserId) {
      throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);
    }

    try {
      // Use Object.assign to update the existing entity
      Object.assign(user, updateUserDto);
      const savedUser = await this.userRepository.save(user);

      await Promise.all([
        this.cacheService.delete(this.cachePrefixes.USER_BY_ID, userId),
        this.cacheService.deleteByPrefix(this.cachePrefixes.USER)
      ]);

      return {
        status: 'success',
        message: 'User Updated Successfully',
        user: {
          id: savedUser.id,
          name: savedUser.name,
          phone: savedUser.phone,
        }
      };
    } catch (error) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'Failed to update user',
        status_code: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async uploadProfilePicture(
    userId: string,
    uploadProfilePicDto: UploadUserProfilePicDto,
  ): Promise<{ status: string; message: string; data: { avatar_url: string } }> {
    if (!uploadProfilePicDto.avatar) throw new CustomHttpException(SYS_MSG.NO_FILE_FOUND, HttpStatus.BAD_REQUEST);

    const user = await this.permissionsService.getUserById(userId);
    if (user.id !== userId) throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);

    try {
      // If user already has a profile picture, delete it from Cloudinary
      if (user.hr_profile_pic_url) {
        const publicId = this.cloudinaryService.getPublicIdFromUrl(user.hr_profile_pic_url);
        await this.cloudinaryService.deleteFile(publicId);
      }

      // Upload new image to Cloudinary
      const avatarUrl = await this.cloudinaryService.uploadFile(uploadProfilePicDto.avatar, 'profile-pictures');

      user.hr_profile_pic_url = avatarUrl;
      await this.userRepository.save(user);

      await Promise.all([
        this.cacheService.delete(this.cachePrefixes.USER_BY_ID, userId),
        this.cacheService.deleteByPrefix(this.cachePrefixes.USER)
      ]);

      return {
        status: 'success',
        message: SYS_MSG.PICTURE_UPDATED,
        data: { avatar_url: avatarUrl },
      };
    } catch (error) {
      this.logger.error(`Failed to upload profile picture: ${error.message}`, error.stack);
      throw new CustomHttpException(
        `Failed to upload profile picture: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(employeeId: string, userId: string): Promise<DeleteUserResponse> {

    const user = await this.permissionsService.getUserById(userId);
    await this.permissionsService.getEntityWithPermissionCheck(Employee, employeeId, user);

    // Find the employee with relation to the HR who added them
    const employee = await this.employeeRepository.findOne({
      where: {
        id: employeeId,
        added_by_hr: { id: userId }
      },
      relations: ['added_by_hr']
    });

    if (!employee) throw new CustomHttpException(SYS_MSG.FORBIDDEN_DELETE_EMPLOYEE, HttpStatus.FORBIDDEN);
    await this.employeeRepository.remove(employee);

    await Promise.all([
      this.cacheService.delete(this.cachePrefixes.EMPLOYEE_BY_ID, employeeId),
      this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE)
    ]);

    return {
      status: 'success',
      message: 'Employee deleted successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password', 'email', 'name']
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);


    const isPasswordValid = await this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isPasswordValid) throw new CustomHttpException(SYS_MSG.INVALID_CURRENT_PWD, HttpStatus.BAD_REQUEST);

    const hashedPassword = await this.passwordService.hashPassword(changePasswordDto.newPassword);
    user.password = hashedPassword;

    try {
      await this.userRepository.save(user);

      Promise.all([
        this.cacheService.delete(this.cachePrefixes.USER_BY_ID, userId),
        this.emailQueueService.sendPasswordChangedMail(user.email, user.name, timestamp)
      ]).catch(error => {
        this.logger.error(`Background tasks after password change failed: ${error.message}`, error.stack);
      });

      return {
        message: SYS_MSG.PASSWORD_UPDATED,
        status: 'success'
      };
    } catch (error) {
      this.logger.error(`Failed to change password: ${error.message}`, error.stack);
      throw new CustomHttpException(SYS_MSG.PASSWORD_CHANGE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deactivateEmployee(
    hrId: string,
    employeeId: string
  ): Promise<DeleteUserResponse> {
    const hr = await this.permissionsService.getUserById(hrId);
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['added_by_hr']
    });

    if (!employee) throw new CustomHttpException(SYS_MSG.EMPLOYEE_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (!this.permissionsService.canAccessEntity(employee, hr)) {
      throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);
    }

    // Deactivate the employee
    employee.status = false;
    employee.deactivated_by = hr.name;
    employee.deactivated_at = new Date();

    // Clear any reactivation data
    employee.reactivated_by = null;
    employee.reactivated_at = null;

    await this.employeeRepository.save(employee);
    await Promise.all([
      this.cacheService.delete(this.cachePrefixes.EMPLOYEE_BY_ID, employeeId),
      this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE)
    ]);
    await this.emailQueueService.sendDeactivationNotification(
      employee.email,
      employee.name,
      timestamp,
      {
        admin: hr.name
      }
    )

    return {
      status: 'success',
      message: 'Employee deactivated successfully',
    };
  }

  async reactivateEmployee(
    hrId: string,
    employeeId: string
  ): Promise<DeleteUserResponse> {
    const hr = await this.permissionsService.getUserById(hrId);
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['added_by_hr']
    });

    if (!employee) throw new CustomHttpException(SYS_MSG.EMPLOYEE_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (!this.permissionsService.canAccessEntity(employee, hr)) {
      throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);
    }

    employee.status = true;
    employee.reactivated_by = hr.name;
    employee.reactivated_at = new Date();

    await this.employeeRepository.save(employee);
    await Promise.all([
      this.cacheService.delete(this.cachePrefixes.EMPLOYEE_BY_ID, employeeId),
      this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE)
    ]);
    await this.emailQueueService.sendReactivationNotification(
      employee.email,
      employee.name,
      timestamp,
      {
        admin: hr.name
      }
    )

    return {
      status: 'success',
      message: 'Employee reactivated successfully',
    };
  }



}
