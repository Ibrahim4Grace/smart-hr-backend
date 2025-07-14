import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { MailInterface } from './interface/email-queue.interface';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('emailSending')
export default class EmailQueueConsumer {
  private logger = new Logger(EmailQueueConsumer.name);
  constructor(private readonly mailerService: MailerService) { }

  @Process('register-otp')
  async sendTokenEmailJob(job: Job<MailInterface>) {
    try {
      const {
        data: { mail },
      } = job;
      this.logger.log(`Processing register-otp job for ${mail.to} with context: ${JSON.stringify(mail.context)}`);
      await this.mailerService.sendMail({
        ...mail,
        subject: 'Welcome to smarth-hr! Confirm your Email',
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
        subject: 'Welcome to The smarth-hr!',
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

  @Process('employee-onboarding')
  async sendEmployeeOnboardingEmail(job: Job<MailInterface>) {
    try {
      const { mail } = job.data;
      this.logger.log(`Processing employee onboarding email job for ${mail.to} with context: ${JSON.stringify(mail.context)}`);

      await this.mailerService.sendMail({
        ...mail,
        subject: `Welcome to ${mail.context.company}!`,
        template: 'employee-onboarding',
      });

      this.logger.log(`Employee onboarding email sent successfully to ${mail.to}`);
    } catch (error) {
      this.logger.error(`Employee onboarding email failed for ${job.data.mail.to}`, error.stack);
      throw error;
    }
  }

  @Process('deactivate-notification')
  async sendDeactivationEmail(job: Job<MailInterface>) {
    try {
      const { mail } = job.data;
      this.logger.log(`Processing deactivation email job for ${mail.to} with full context: ${JSON.stringify(mail)}`);

      await this.mailerService.sendMail({
        ...mail,
        subject: 'Your Account Has Been Deactivated',
        template: 'deactivate-notification',
      });
      this.logger.log(`Deactivation notice sent successfully to ${mail.to}`);
    } catch (error) {
      this.logger.error(`Deactivation email failed for ${job.data.mail.to}`, {
        error: error.message,
        stack: error.stack,
        jobData: JSON.stringify(job.data),
      });
      throw error;
    }
  }

  @Process('reactivate-notification')
  async sendReactivationEmail(job: Job<MailInterface>) {
    try {
      const { mail } = job.data;
      this.logger.log(`Sending reactivation notice to ${mail.to}`);

      await this.mailerService.sendMail({
        ...mail,
        subject: 'Your Account Has Been Reactivated',
        template: 'reactivate-notification',
      });

      this.logger.log(`Reactivation notice sent to ${mail.to}`);
    } catch (error) {
      this.logger.error(`Reactivation email failed for ${job.data.mail.to}`, error.stack);
    }
  }

  @Process('account-deletion')
  async sendAccountDeletionEmail(job: Job<MailInterface>) {
    try {
      this.logger.log(`Received account-deletion job with data: ${JSON.stringify(job.data)}`);

      const { mail } = job.data;
      this.logger.log(`Processing deleting hr and its employees account email job for ${mail.to} with context: ${JSON.stringify(mail.context)}`);

      await this.mailerService.sendMail({
        ...mail,
        subject: 'Account Deletion Notification',
        template: 'account-deletion',
      });

      this.logger.log(`Hr and its employee account delete email sent successfully to ${mail.to}`);
    } catch (error) {
      console.log(`Hr and its employee account delete email failed for ${job.data.mail.to}`, error.stack);
      throw error;
    }
  }

  @Process('invoice-created')
  async sendInvoiceCreatedEmail(job: Job<MailInterface>) {
    try {
      const { mail } = job.data;
      this.logger.log(`Processing invoice created email job for ${mail.to} with context: ${JSON.stringify(mail.context)}`);

      const mailOptions: any = {
        ...mail,
        subject: `New Invoice: ${mail.context.invoiceNumber}`,
        template: 'invoice-created',
      };

      // Add attachments if they exist
      if (mail.attachments && mail.attachments.length > 0) {
        mailOptions.attachments = mail.attachments.map(attachment => ({
          ...attachment,
          // Convert base64 back to Buffer if needed
          content: typeof attachment.content === 'string' && attachment.encoding === 'base64'
            ? Buffer.from(attachment.content, 'base64')
            : attachment.content
        }));
      }

      await this.mailerService.sendMail(mailOptions);

      this.logger.log(`Invoice created email sent successfully to ${mail.to}`);
    } catch (error) {
      this.logger.error(`Invoice created email failed for ${job.data.mail.to}`, error.stack);
      throw error;
    }
  }

}
