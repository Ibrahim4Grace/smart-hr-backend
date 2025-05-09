import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailQueueService } from './email-queue.service';
import { QueueService } from './queue.service';
import EmailQueueConsumer from './email-queue.consumer';
import { EmailQueueController } from './email-queue.controller';
import { BullModule } from '@nestjs/bull';

@Module({
  providers: [EmailQueueService, QueueService, EmailQueueConsumer],
  exports: [EmailQueueService, QueueService],
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    BullModule.registerQueueAsync({
      name: 'emailSending',
    }),
    ConfigModule,
  ],
  controllers: [EmailQueueController],
})
export class EmailQueueModule { }
