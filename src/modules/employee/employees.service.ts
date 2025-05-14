import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { PaginationService } from '@shared/services/pagination.service';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CloudinaryService } from '@shared/services/cloudinary.service';
import { UploadProfilePicDto } from './dto/upload-profile-pic.dto';
import { Logger } from '@nestjs/common';
import { CacheService } from '@shared/cache/cache.service';
import { CachePrefixesService } from '@shared/cache/cache.prefixes.service';
import { PasswordService } from '../auth/password.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { timestamp } from '@utils/time';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private cloudinaryService: CloudinaryService,
    private cacheService: CacheService,
    private cachePrefixes: CachePrefixesService,
    private passwordService: PasswordService,
    private emailQueueService: EmailQueueService,
  ) { }

  async getEmployeeById(userId: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId }
    });
    return employee;
  }

  async update(employeeId: string, updateEmployeeDto: UpdateEmployeeDto, userId: string) {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) throw new CustomHttpException(SYS_MSG.EMPLOYEE_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (employee.id !== userId) {
      throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);
    }

    const updatedEmployee = { ...employee, ...updateEmployeeDto };
    const savedEmployee = await this.employeeRepository.save(updatedEmployee);

    await Promise.all([
      this.cacheService.delete(this.cachePrefixes.EMPLOYEE, employeeId),
      this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE_LIST)
    ]);

    return savedEmployee;
  }

  async uploadProfilePicture(
    employeeId: string,
    uploadProfilePicDto: UploadProfilePicDto,
  ): Promise<{ status: string; message: string; data: { avatar_url: string } }> {
    if (!uploadProfilePicDto.avatar) throw new CustomHttpException(SYS_MSG.NO_FILE_FOUND, HttpStatus.BAD_REQUEST);

    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      select: ['id', 'employee_profile_pic_url']
    });
    if (!employee) throw new CustomHttpException(SYS_MSG.EMPLOYEE_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (employee.id !== employeeId) {
      throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);
    }

    try {
      if (employee.employee_profile_pic_url) {
        const publicId = this.cloudinaryService.getPublicIdFromUrl(employee.employee_profile_pic_url);
        await this.cloudinaryService.deleteFile(publicId);
      }

      const avatarUrl = await this.cloudinaryService.uploadFile(uploadProfilePicDto.avatar, 'employee-profile-pictures');

      employee.employee_profile_pic_url = avatarUrl;
      await this.employeeRepository.save(employee);

      await this.cacheService.delete(this.cachePrefixes.EMPLOYEE, employeeId);

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

  async changePassword(employeeId: string, changePasswordDto: ChangePasswordDto) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      select: ['id', 'password', 'email', 'first_name', 'last_name']
    });

    if (!employee) throw new CustomHttpException(SYS_MSG.EMPLOYEE_NOT_FOUND, HttpStatus.NOT_FOUND);

    const isPasswordValid = await this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      employee.password
    );

    if (!isPasswordValid) throw new CustomHttpException(SYS_MSG.INVALID_CURRENT_PWD, HttpStatus.BAD_REQUEST);
    const hashedPassword = await this.passwordService.hashPassword(changePasswordDto.newPassword);
    employee.password = hashedPassword;

    try {
      await this.employeeRepository.save(employee);

      Promise.all([
        this.cacheService.delete(this.cachePrefixes.EMPLOYEE, employeeId),
        this.emailQueueService.sendPasswordChangedMail(employee.email, employee.name, timestamp)
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
}

