import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { UserService } from '@modules/user/user.service';
import { EmailQueueService } from '@modules/email-queue/email-queue.service';
import { Role } from '@modules/role/entities/role.entity';
import { EmailQueueModule } from '@modules/email-queue/email-queue.module';
import { ConfigModule } from '@nestjs/config';
import { PasswordService } from '../auth/password.service';
import { AuthHelperService } from './auth-helper.service';
import { JwtService } from '@nestjs/jwt';
import { SharedModule } from '@shared/shared.module';
import { Employee } from '../employee/entities/employee.entity';
import { EmployeeAuthService } from './employee-auth.service';
import { EmployeesModule } from '@modules/employee/employees.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    Repository,
    UserService,
    EmailQueueService,
    PasswordService,
    AuthHelperService,
    {
      provide: 'JWT_REFRESH_SERVICE',
      useExisting: JwtService,
    },
    EmployeeAuthService,
  ],
  imports: [
    TypeOrmModule.forFeature([User, Role, Employee]),
    EmailQueueModule,
    ConfigModule,
    SharedModule,
    EmployeesModule,
  ],
  exports: [AuthService, PasswordService, AuthHelperService, EmployeeAuthService],
})
export class AuthModule { }
