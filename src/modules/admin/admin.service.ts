import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Logger } from '@nestjs/common';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
    ) { }

    async deactivateHrAccount(hrId: string, reason: string, adminId: string): Promise<void> {
        const hr = await this.userRepository.findOne({
            where: { id: hrId, role: UserRole.HR },
        });

        if (!hr) {
            throw new CustomHttpException('HR account not found', HttpStatus.NOT_FOUND);
        }

        // Deactivate HR account
        await this.userRepository.update(hrId, {
            status: false,
            deactivation_reason: reason,
            deactivated_by: adminId,
            deactivated_at: new Date(),
        });

        // Deactivate all employees added by this HR
        await this.employeeRepository.update(
            { added_by_hr: { id: hrId } },
            {
                status: false,
                deactivation_reason: `HR account deactivated: ${reason}`,
                deactivated_by: adminId,
                deactivated_at: new Date(),
            },
        );

        this.logger.log(`HR account ${hrId} and associated employees deactivated by admin ${adminId}`);
    }

    async reactivateHrAccount(hrId: string, reason: string, adminId: string): Promise<void> {
        const hr = await this.userRepository.findOne({
            where: { id: hrId, role: UserRole.HR },
        });

        if (!hr) {
            throw new CustomHttpException('HR account not found', HttpStatus.NOT_FOUND);
        }

        // Reactivate HR account
        await this.userRepository.update(hrId, {
            status: true,
            reactivation_reason: reason,
            reactivated_by: adminId,
            reactivated_at: new Date(),
        });

        // Reactivate all employees added by this HR
        await this.employeeRepository.update(
            { added_by_hr: { id: hrId } },
            {
                status: true,
                reactivation_reason: `HR account reactivated: ${reason}`,
                reactivated_by: adminId,
                reactivated_at: new Date(),
            },
        );

        this.logger.log(`HR account ${hrId} and associated employees reactivated by admin ${adminId}`);
    }

    async getHrAccounts(): Promise<User[]> {
        return this.userRepository.find({
            where: { role: UserRole.HR },
            select: ['id', 'name', 'email', 'status', 'deactivation_reason', 'deactivated_at', 'reactivation_reason', 'reactivated_at'],
        });
    }

    async getHrAccountDetails(hrId: string): Promise<User> {
        const hr = await this.userRepository.findOne({
            where: { id: hrId, role: UserRole.HR },
            select: ['id', 'name', 'email', 'status', 'deactivation_reason', 'deactivated_at', 'reactivation_reason', 'reactivated_at'],
        });

        if (!hr) {
            throw new CustomHttpException('HR account not found', HttpStatus.NOT_FOUND);
        }

        return hr;
    }


} 