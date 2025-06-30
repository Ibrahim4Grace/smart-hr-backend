import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Logger } from '@nestjs/common';
import { CacheService } from '@shared/cache/cache.service';
import { PaginationService } from '@shared/services/pagination.service';
import { CachePrefixesService } from '@shared/cache/cache.prefixes.service';
import { EntityPermissionsService } from '@shared/services/permissions.service';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { UploadUserProfilePicDto } from '@modules/user/dto/upload-profile-pic.dto';
import { CloudinaryService } from '@shared/services/cloudinary.service';
import { DeleteUserResponse, UpdateUserResponseDTO, UpdateUserDto } from '@modules/user/dto/create-user.dto';
import { ChangePasswordDto } from '@modules/employee/dto/change-password.dto';
import { EmailQueueService } from '@modules/email-queue/email-queue.service';
import { PasswordService } from '../auth/password.service';
import { timestamp } from '@utils/time';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
        private readonly paginationService: PaginationService,
        private cacheService: CacheService,
        private cachePrefixes: CachePrefixesService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly permissionsService: EntityPermissionsService,
        private emailQueueService: EmailQueueService,
        private passwordService: PasswordService,
        @InjectDataSource()
        private dataSource: DataSource,
    ) { }

    async findAllHR(paginationOptions: PaginationOptions<User>) {
        const cacheKey = `hr:${JSON.stringify(paginationOptions)}`;

        return this.cacheService.getOrSet(
            this.cachePrefixes.USER,
            cacheKey,
            async () => {
                return this.paginationService.paginate(
                    this.userRepository,
                    { role: UserRole.HR },
                    {
                        ...paginationOptions,
                    }
                );
            },
            this.cacheService.CACHE_TTL.MEDIUM
        );
    }

    async findHRById(id: string) {
        return this.cacheService.getOrSet(
            this.cachePrefixes.USER_BY_ID,
            `hr:${id}`,
            async () => {
                const user = await this.userRepository.findOne({
                    where: { id, role: UserRole.HR }
                });

                if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
                return {
                    status_code: 200,
                    user,
                };
            },
            this.cacheService.CACHE_TTL.MEDIUM
        );
    }

    async findAllAdmins(paginationOptions: PaginationOptions<User>) {
        const cacheKey = `admin:${JSON.stringify(paginationOptions)}`;

        return this.cacheService.getOrSet(
            this.cachePrefixes.USER,
            cacheKey,
            async () => {
                return this.paginationService.paginate(
                    this.userRepository,
                    { role: UserRole.SUPER_ADMIN },
                    {
                        ...paginationOptions
                    }
                );
            },
            this.cacheService.CACHE_TTL.MEDIUM
        );
    }

    async findAdminById(id: string) {
        return this.cacheService.getOrSet(
            this.cachePrefixes.USER_BY_ID,
            `admin:${id}`,
            async () => {
                const user = await this.userRepository.findOne({
                    where: { id, role: UserRole.SUPER_ADMIN }
                });

                if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
                return {
                    status_code: 200,
                    user,
                };
            },
            this.cacheService.CACHE_TTL.MEDIUM
        );
    }

    async getAdminInfo(adminId: string) {
        return this.cacheService.getOrSet(
            this.cachePrefixes.USER_BY_ID,
            `admin:${adminId}`,
            async () => {
                const admin = await this.userRepository.findOne({
                    where: { id: adminId, role: UserRole.SUPER_ADMIN }
                });

                if (!admin) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
                return {
                    status_code: 200,
                    admin
                };
            },
            this.cacheService.CACHE_TTL.MEDIUM
        );
    }



    async uploadProfilePicture(
        userId: string,
        uploadProfilePicDto: UploadUserProfilePicDto,
    ): Promise<{ status: string; message: string; data: { avatar_url: string } }> {
        if (!uploadProfilePicDto.avatar) throw new CustomHttpException(SYS_MSG.NO_FILE_FOUND, HttpStatus.BAD_REQUEST);

        const user = await this.permissionsService.getUserById(userId);
        if (user.id !== userId) throw new CustomHttpException(SYS_MSG.FORBIDDEN_ACTION, HttpStatus.FORBIDDEN);


        try {
            if (user.hr_profile_pic_url) {
                const publicId = this.cloudinaryService.getPublicIdFromUrl(user.hr_profile_pic_url);
                await this.cloudinaryService.deleteFile(publicId);
            }

            const avatarUrl = await this.cloudinaryService.uploadFile(uploadProfilePicDto.avatar, 'profile-pictures');

            user.admin_profile_pic_url = avatarUrl;
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

    async remove(adminId: string, targetHrId: string): Promise<DeleteUserResponse> {
        const [admin, targetHr] = await Promise.all([
            this.userRepository.findOne({
                where: { id: adminId, role: UserRole.SUPER_ADMIN },
                cache: false
            }),
            this.userRepository.findOne({
                where: { id: targetHrId, role: UserRole.HR },
                relations: ['employees'],
                cache: false
            })
        ]);

        if (!admin) throw new CustomHttpException(SYS_MSG.ADMIN_NOT_FOUND, HttpStatus.UNAUTHORIZED);
        if (!targetHr) throw new CustomHttpException(SYS_MSG.HR_NOT_FOUND, HttpStatus.NOT_FOUND);


        try {
            // Send notification emails before deletion
            await Promise.all([
                // Send notification to HR
                this.emailQueueService.sendAccountDeletionNotification(
                    targetHr.email,
                    targetHr.name,
                    timestamp,
                    {
                        admin: admin.name
                    }

                ),
                // Send notifications to all employees
                ...targetHr.employees.map(employee =>
                    this.emailQueueService.sendAccountDeletionNotification(
                        employee.email,
                        employee.name,
                        timestamp,
                        {
                            admin: admin.name
                        }
                    )
                )
            ]);

            // Begin transaction to ensure atomicity
            await this.dataSource.transaction(async (transactionalEntityManager) => {
                // Delete employees and HR in parallel
                await Promise.all([
                    // Delete all employees
                    transactionalEntityManager.remove(targetHr.employees),
                    // Delete the HR
                    transactionalEntityManager.remove(targetHr)
                ]);
            });

            // Clear cache in parallel
            await Promise.all([
                this.cacheService.delete(this.cachePrefixes.USER_BY_ID, targetHrId),
                this.cacheService.delete(this.cachePrefixes.USER_BY_EMAIL, targetHr.email),
            ]);

            return {
                status: 'success',
                message: 'HR and all associated employees deleted successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to delete hr ${targetHrId}: ${error.message}`, error.stack);
            throw new CustomHttpException(SYS_MSG.USER_DELETE_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const admin = await this.userRepository.findOne({
            where: { id: userId, role: UserRole.SUPER_ADMIN },
            select: ['id', 'password', 'email', 'name']
        });

        if (!admin) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);


        const isPasswordValid = await this.passwordService.comparePassword(
            changePasswordDto.currentPassword,
            admin.password
        );

        if (!isPasswordValid) throw new CustomHttpException(SYS_MSG.INVALID_CURRENT_PWD, HttpStatus.BAD_REQUEST);

        const hashedPassword = await this.passwordService.hashPassword(changePasswordDto.newPassword);
        admin.password = hashedPassword;

        try {
            await this.userRepository.save(admin);

            Promise.all([
                this.cacheService.delete(this.cachePrefixes.USER_BY_ID, userId),
                this.emailQueueService.sendPasswordChangedMail(admin.email, admin.name, timestamp)
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

    async deactivateHrAccount(hrId: string, adminId: string): Promise<DeleteUserResponse> {

        const [hr, admin] = await Promise.all([
            this.userRepository.findOne({
                where: { id: hrId, role: UserRole.HR },
            }),
            this.userRepository.findOne({
                where: { id: adminId, role: In([UserRole.SUPER_ADMIN, UserRole.ADMIN]) }
            })
        ]);

        if (!hr) throw new CustomHttpException('HR account not found', HttpStatus.NOT_FOUND);
        if (!admin) throw new CustomHttpException('Admin not found', HttpStatus.NOT_FOUND);

        // Using transaction to ensure consistency
        await this.userRepository.manager.transaction(async transactionalEntityManager => {
            // Deactivate HR account and clear reactivation data
            await transactionalEntityManager.update(User, hrId, {
                status: false,
                deactivated_by: admin.name,
                deactivated_at: new Date(),
                reactivated_by: null,
                reactivated_at: null
            });

            // Get all employees associated with this HR (for notification)
            const employees = await transactionalEntityManager.find(Employee, {
                where: { added_by_hr: { id: hrId } },
            });

            //Deactivate all employees added by this HR and clear reactivation data
            await transactionalEntityManager.update(
                Employee,
                { added_by_hr: { id: hrId } },
                {
                    status: false,
                    deactivated_by: admin.name,
                    deactivated_at: new Date(),
                    reactivated_by: null,
                    reactivated_at: null
                },
            );

            // Send notification to HR
            await this.emailQueueService.sendDeactivationNotification(
                hr.email,
                hr.name,
                timestamp,
                {
                    admin: admin.name
                }
            )

            // Send notifications to all employees
            for (const employee of employees) {
                this.emailQueueService.sendDeactivationNotification(
                    employee.email,
                    employee.name,
                    timestamp,
                    {
                        admin: admin.name
                    }
                )
            }
        });

        // Clear cache after successful transaction
        await Promise.all([
            this.cacheService.delete(this.cachePrefixes.USER_BY_ID, hrId),
            this.cacheService.delete(this.cachePrefixes.USER_BY_EMAIL, hr.email),
            this.cacheService.deleteByPrefix(this.cachePrefixes.USER),
            this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE)
        ]);

        this.logger.log(`HR account ${hrId} and associated employees deactivated by admin ${adminId}`);

        return {
            status: 'success',
            message: 'HR account and associated employees deactivated by admin}',
        };
    }

    async reactivateHrAccount(hrId: string, adminId: string): Promise<DeleteUserResponse> {
        const [hr, admin] = await Promise.all([
            this.userRepository.findOne({
                where: { id: hrId, role: UserRole.HR },
            }),
            this.userRepository.findOne({
                where: { id: adminId, role: In([UserRole.SUPER_ADMIN, UserRole.ADMIN]) }
            })
        ]);

        if (!hr) throw new CustomHttpException('HR account not found', HttpStatus.NOT_FOUND);
        if (!admin) throw new CustomHttpException('Admin not found', HttpStatus.NOT_FOUND);


        // Use a transaction to ensure consistency
        await this.userRepository.manager.transaction(async transactionalEntityManager => {
            // 1. Reactivate HR account
            await transactionalEntityManager.update(User, hrId, {
                status: true,
                reactivated_by: admin.name,
                reactivated_at: new Date(),
                deactivated_by: null,
                deactivated_at: null,
            });

            // 2. Get all employees associated with this HR (for notification)
            const employees = await transactionalEntityManager.find(Employee, {
                where: { added_by_hr: { id: hrId } },
            });

            // 3. Reactivate all employees added by this HR
            await transactionalEntityManager.update(
                Employee,
                { added_by_hr: { id: hrId } },
                {
                    status: true,
                    reactivated_by: admin.name,
                    reactivated_at: new Date(),
                    deactivated_by: null,
                    deactivated_at: null,

                },
            );

            // Send notification to HR
            await this.emailQueueService.sendReactivationNotification(
                hr.email,
                hr.name,
                timestamp,
                {
                    admin: admin.name
                }
            )

            // Send notifications to all employees
            for (const employee of employees) {
                this.emailQueueService.sendReactivationNotification(
                    employee.email,
                    employee.name,
                    timestamp,
                    {
                        admin: admin.name
                    }
                )
            }
        });

        // Clear cache after successful transaction
        await Promise.all([
            this.cacheService.delete(this.cachePrefixes.USER_BY_ID, hrId),
            this.cacheService.delete(this.cachePrefixes.USER_BY_EMAIL, hr.email),
            this.cacheService.deleteByPrefix(this.cachePrefixes.USER),
            this.cacheService.deleteByPrefix(this.cachePrefixes.EMPLOYEE)
        ]);

        this.logger.log(`HR account ${hrId} and associated employees reactivated by admin ${adminId}`);

        return {
            status: 'success',
            message: 'HR account and associated employees reactivated by admin',
        };
    }



} 