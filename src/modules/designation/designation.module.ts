import { Module } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { DesignationController } from './designation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Designation } from './entities/designation.entity';
import { User } from '../user/entities/user.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Designation, User]), SharedModule],
  controllers: [DesignationController],
  providers: [DesignationService],
})
export class DesignationModule { }
