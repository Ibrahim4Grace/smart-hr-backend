import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { Department } from './entities/department.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Employee } from '../employee/entities/employee.entity';
import { SharedModule } from '../../shared/shared.module';


@Module({
  imports: [TypeOrmModule.forFeature([Department, User, Employee]), SharedModule],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule { }
