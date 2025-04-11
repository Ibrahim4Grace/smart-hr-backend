import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from './email.service';
import { QueueService } from './queue.service';
import EmailQueueConsumer from './email.consumer';
import { EmailController } from './email.controller';
import { BullModule } from '@nestjs/bull';

@Module({
  providers: [EmailService, QueueService, EmailQueueConsumer],
  exports: [EmailService, QueueService],
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    BullModule.registerQueueAsync({
      name: 'emailSending',
    }),
    ConfigModule,
  ],
  controllers: [EmailController],
})
export class EmailModule {}
