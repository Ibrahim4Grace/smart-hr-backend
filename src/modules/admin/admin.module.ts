import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserService } from '@modules/user/user.service';
import { EmployeesService } from '@modules/employee/employees.service';
import { SharedModule } from '@shared/shared.module';
import { AuthModule } from '@modules/auth/auth.module';
import { EmailQueueModule } from '@modules/email-queue/email-queue.module';
import { CloudinaryService } from '@shared/services/cloudinary.service';


@Module({
    imports: [
        TypeOrmModule.forFeature([User, Employee]),
        SharedModule,
        AuthModule,
        EmailQueueModule,
    ],
    controllers: [AdminController],
    providers: [AdminService, UserService, EmployeesService, CloudinaryService],
    exports: [AdminService],
})
export class AdminModule { } 