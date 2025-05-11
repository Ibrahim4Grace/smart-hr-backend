import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { UserModule } from '../user/user.module';
import { SharedModule } from '@shared/shared.module';
import { PasswordService } from '../auth/password.service';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    UserModule,
    SharedModule,
    EmailQueueModule
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, PasswordService],
  exports: [EmployeesService],
})
export class EmployeesModule { }
