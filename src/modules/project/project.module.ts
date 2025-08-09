import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Client } from '../client/entities/client.entity';
import { User } from '../user/entities/user.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Employee, Client, User]), SharedModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule { }
