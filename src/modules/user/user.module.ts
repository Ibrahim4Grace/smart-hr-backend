import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Role } from '@modules/role/entities/role.entity';
import { User } from './entities/user.entity';
import { PasswordService } from '../auth/password.service';
import { EmailQueueService } from '@modules/email-queue/email-queue.service';
import { EmailQueueModule } from '@modules/email-queue/email-queue.module';
import { CloudinaryService } from '@shared/services/cloudinary.service';
import { SharedModule } from '@shared/shared.module';

@Module({
  controllers: [UserController],
  providers: [UserService, Repository, PasswordService, EmailQueueService, CloudinaryService],
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    SharedModule,
    EmailQueueModule,
  ],
  exports: [UserService],
})
export class UserModule { }
