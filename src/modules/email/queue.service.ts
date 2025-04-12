import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { MailInterface } from './interface/mail.interface';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';

Injectable();
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  constructor(
    @InjectQueue('emailSending')
    private readonly emailQueue: Queue,
  ) {}

  async sendMail({ variant, mail }: MailSender) {
    this.logger.log(
      `Queuing email job for variant: ${variant} to: ${mail.to} with context: ${JSON.stringify(mail.context)}`,
    );
    const mailJob = await this.emailQueue.add(variant, { mail });
    return { jobId: mailJob.id };
  }
}

export interface MailSender {
  mail: MailInterface;
  variant:
    | 'register-otp'
    | 'welcome'
    | 'forgot-otp'
    | 'reset-successful'
    | 'deactivate-notification'
    | 'reactivate-notification';
}
