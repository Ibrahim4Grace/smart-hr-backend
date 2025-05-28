import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from './queue.service';
import { MailInterface } from './interface/email-queue.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: QueueService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('auth.frontendUrl');
  }

  async sendUserEmailConfirmationOtp(email: string, name: string, otp: string) {
    const mailPayload: MailInterface = {
      to: email,
      context: {
        otp,
        name,
      },
    };

    await this.mailerService.sendMail({ variant: 'register-otp', mail: mailPayload });
  }

  async sendUserConfirmationMail(email: string, name: string, timestamp: string) {
    const mailPayload: MailInterface = {
      to: email,
      context: {
        name,
        email,
        timestamp,
      },
    };

    await this.mailerService.sendMail({ variant: 'welcome', mail: mailPayload });
  }

  async sendForgotPasswordMail(email: string, name: string, otp: string) {
    const mailPayload: MailInterface = {
      to: email,
      context: {
        name,
        otp,
      },
    };

    await this.mailerService.sendMail({ variant: 'forgot-otp', mail: mailPayload });
  }

  async sendPasswordChangedMail(email: string, name: string, timestamp: string) {
    const mailPayload: MailInterface = {
      to: email,
      context: {
        name,
        email,
        timestamp,
      },
    };

    await this.mailerService.sendMail({ variant: 'reset-successful', mail: mailPayload });
  }

  async sendEmployeeOnboardingEmail(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    company: string,
  ) {
    const mailPayload: MailInterface = {
      to: email,
      context: {
        firstName,
        lastName,
        email,
        password,
        company,
        loginUrl: this.frontendUrl,
      },
    };

    await this.mailerService.sendMail({
      variant: 'employee-onboarding',
      mail: mailPayload,
    });
  }

  async sendDeactivationNotification(
    email: string,
    name: string,
    timestamp: string,
    context: { admin: string },
  ) {
    this.logger.log(
      `Preparing deactivation email for ${email} with context: ${JSON.stringify({ name, ...context, timestamp })}`,
    );
    const mailPayload: MailInterface = {
      to: email,
      context: {
        name,
        admin: context.admin,
        timestamp,
      },
    };
    this.logger.log(`Sending mail payload to queue: ${JSON.stringify(mailPayload)}`);
    await this.mailerService.sendMail({
      variant: 'deactivate-notification',
      mail: mailPayload,
    });
  }

  async sendReactivationNotification(
    email: string,
    name: string,
    timestamp: string,
    context: { admin: string },
  ) {
    const mailPayload: MailInterface = {
      to: email,
      context: {
        name,
        admin: context.admin,
        timestamp,
      },
    };

    await this.mailerService.sendMail({
      variant: 'reactivate-notification',
      mail: mailPayload,
    });
  }

  async sendAccountDeletionNotification(
    email: string,
    name: string,
    timestamp: string,
    context: { admin: string },
  ) {
    this.logger.log(
      `Preparing deletion  email for ${email} with context: ${JSON.stringify({ name, ...context, timestamp })}`,
    );
    const mailPayload: MailInterface = {
      to: email,
      context: {
        name,
        admin: context.admin,
        timestamp,
      },
    };
    this.logger.log(`Sending mail payload to queue: ${JSON.stringify(mailPayload)}`);
    await this.mailerService.sendMail({
      variant: 'account-deletion',
      mail: mailPayload,
    });
  }

}
