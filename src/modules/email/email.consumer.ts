import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { MailInterface } from './interface/mail.interface';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('emailSending')
export default class EmailQueueConsumer {
  private logger = new Logger(EmailQueueConsumer.name);
  constructor(private readonly mailerService: MailerService) {}

  @Process('register-otp')
  async sendTokenEmailJob(job: Job<MailInterface>) {
    try {
      const {
        data: { mail },
      } = job;
      this.logger.log(`Processing register-otp job for ${mail.to} with context: ${JSON.stringify(mail.context)}`);
      await this.mailerService.sendMail({
        ...mail,
        subject: 'Welcome to spot! Confirm your Email',
        template: 'register-otp',
      });
      this.logger.log(`Register OTP email sent successfully to ${mail.to}`);
    } catch (sendTokenEmailJobError) {
      this.logger.error(`EmailQueueConsumer ~ sendTokenEmailJobError:   ${sendTokenEmailJobError}`);
    }
  }

  @Process('welcome')
  async sendWelcomeEmailJob(job: Job<MailInterface>) {
    try {
      const {
        data: { mail },
      } = job;
      await this.mailerService.sendMail({
        ...mail,
        subject: 'Welcome to The Spot!',
        template: 'email-complete',
      });
      this.logger.log(`Welcome email sent successfully to ${mail.to}`);
    } catch (sendWelcomeEmailJobError) {
      this.logger.error(`EmailQueueConsumer ~ sendWelcomeEmailJobError:  ${sendWelcomeEmailJobError}`);
    }
  }

  @Process('forgot-otp')
  async sendForgotPasswordEmailJob(job: Job<MailInterface>) {
    try {
      const {
        data: { mail },
      } = job;
      this.logger.log(`Processing forgot-password job for ${mail.to} with context: ${JSON.stringify(mail.context)}`);
      await this.mailerService.sendMail({
        ...mail,
        subject: 'Reset Your Password',
        template: 'forgot-password',
      });
      this.logger.log(`Forgot password email sent successfully to ${mail.to}`);
    } catch (sendForgotPasswordEmailJobError) {
      this.logger.error(`EmailQueueConsumer ~ sendForgotPasswordEmailJobError:   ${sendForgotPasswordEmailJobError}`);
    }
  }

  @Process('reset-successful')
  async sendPasswordChangedEmailJob(job: Job<MailInterface>) {
    try {
      const {
        data: { mail },
      } = job;
      this.logger.log(
        `Processing password-reset-complete job for ${mail.to} with context: ${JSON.stringify(mail.context)}`,
      );
      await this.mailerService.sendMail({
        ...mail,
        subject: 'Password Changed Successfully',
        template: 'password-reset-complete',
      });
      this.logger.log(`Password Changed Successfully email sent successfully to ${mail.to}`);
    } catch (sendPasswordChangedEmailJobError) {
      this.logger.error(`EmailQueueConsumer ~ sendPasswordChangedEmailJobError:   ${sendPasswordChangedEmailJobError}`);
    }
  }
}
