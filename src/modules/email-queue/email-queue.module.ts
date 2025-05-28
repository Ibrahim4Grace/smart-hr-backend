import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailQueueService } from './email-queue.service';
import { QueueService } from './queue.service';
import EmailQueueConsumer from './email-queue.consumer';

import { BullModule } from '@nestjs/bull';

@Module({
  providers: [EmailQueueService, QueueService, EmailQueueConsumer],
  exports: [EmailQueueService, QueueService],
  imports: [
    TypeOrmModule.forFeature([User]),
    BullModule.registerQueueAsync({
      name: 'emailSending',
    }),
    ConfigModule,
  ],

})
export class EmailQueueModule { }
