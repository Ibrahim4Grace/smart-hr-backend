import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { EmailAccount } from './entities/email.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { ReplyEmailDto } from './dto/reply-email.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { EntityPermissionsService } from '@shared/services/permissions.service';
import { EmailAttachment } from './interface/email.interface';
import { CloudinaryService } from '@shared/services/cloudinary.service';
import { PaginationService } from '@shared/services/pagination.service';
import { CacheService } from '@shared/cache/cache.service';
import { CachePrefixesService } from '@shared/cache/cache.prefixes.service';
import { NotificationService } from '@shared/notification/notification.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailAccount)
    private readonly emailRepository: Repository<EmailAccount>,
    private readonly mailerService: MailerService,
    private readonly permissionsService: EntityPermissionsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly paginationService: PaginationService,
    private readonly cacheService: CacheService,
    private readonly cachePrefixes: CachePrefixesService,
    private readonly notificationService: NotificationService,
  ) { }


  private extractEmail(emailStr: string): string {
    const match = emailStr.match(/<([^>]+)>/);
    return match ? match[1] : emailStr;
  }

  private async getUserWithCache(userId: string): Promise<any> {
    return this.cacheService.getOrSet(
      this.cachePrefixes.USER,
      userId,
      () => this.permissionsService.getUserById(userId),
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }


  private async getUserByEmailWithCache(email: string): Promise<any> {
    return this.cacheService.getOrSet(
      this.cachePrefixes.USER_BY_EMAIL,
      email,
      () => this.permissionsService.getUserByEmail(email),
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  private async processFileAttachments(files: Express.Multer.File[]): Promise<EmailAttachment[]> {
    if (!files || files.length === 0) {
      return [];
    }
    // Parallel upload to Cloudinary for better performance
    const cloudinaryPromises = files.map(file =>
      this.cloudinaryService.uploadFile(file, 'email-attachments')
    );
    const cloudinaryUrls = await Promise.all(cloudinaryPromises);
    return files.map((file, index) => ({
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      cloudinaryUrl: cloudinaryUrls[index],
      buffer: file.buffer,
    }));
  }


  async sendEmail(userId: string, fromEmail: string, sendEmailDto: SendEmailDto, files: Express.Multer.File[] = []) {
    this.logger.debug(`Attempting to send email from ${fromEmail} to ${sendEmailDto.to}`);

    try {
      const user = await this.getUserWithCache(userId);
      if (!fromEmail) fromEmail = user.email;
      if (!user.email) throw new Error('User email not found');

      // Process attachments asynchronously for better performance
      const emailAttachments = await this.processFileAttachments(files);

      // Format the from field
      const formattedFrom = user.name ? `"${user.name}" <${fromEmail}>` : fromEmail;

      const recipientEmail = this.extractEmail(sendEmailDto.to);

      // Find recipient user (with caching)
      const recipientUser = await this.getUserByEmailWithCache(recipientEmail);
      if (!recipientUser) throw new Error(`Recipient user not found: ${recipientEmail}`);

      // Prepare both emails for batch insertion
      const sentEmail = this.emailRepository.create({
        userId,
        from: formattedFrom,
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        body: sendEmailDto.body,
        folder: 'sent',
        attachments: emailAttachments.map(({ buffer, ...metadata }) => metadata),
        ownerEmail: fromEmail,
      });

      const receivedEmail = this.emailRepository.create({
        userId: recipientUser.id,
        from: formattedFrom,
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        body: sendEmailDto.body,
        folder: 'inbox',
        attachments: emailAttachments.map(({ buffer, ...metadata }) => metadata),
        ownerEmail: recipientEmail,
      });

      // Prepare mailer attachments format 
      const mailerAttachments = emailAttachments.map(attachment => ({
        filename: attachment.originalname,
        content: attachment.buffer,
        contentType: attachment.mimetype,
      }));

      // Send email and save to database concurrently for better performance
      const [emailResult] = await Promise.all([
        this.mailerService.sendMail({
          to: sendEmailDto.to,
          from: formattedFrom,
          replyTo: fromEmail,
          subject: sendEmailDto.subject,
          html: sendEmailDto.body,
          cc: sendEmailDto.cc,
          bcc: sendEmailDto.bcc,
          attachments: mailerAttachments,
        }),
        this.emailRepository.save([sentEmail, receivedEmail])
      ]);

      // Send notification to recipient
      await this.notificationService.sendEmailNotification(recipientUser.id, {
        subject: sendEmailDto.subject,
        from: formattedFrom,
        preview: sendEmailDto.body.substring(0, 100) + '...',
      });

      this.logger.debug('Email sent and stored successfully');
      return { success: true, message: 'Email sent successfully', email: sentEmail };
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }


  async getEmails(userId: string, userEmail: string, options: { page: number; limit: number; folder: string }) {
    const { folder } = options;

    try {
      const user = await this.permissionsService.getUserById(userId);

      // For inbox, get emails where the user is the recipient
      // For sent, get emails where the user is the sender
      // For trash, get emails where the user is either sender or recipient
      const whereClause = folder === 'inbox'
        ? { to: user.email, folder: 'inbox' }
        : folder === 'sent'
          ? { from: Like(`%${user.email}%`), folder: 'sent' }
          : { folder: 'trash', userId: user.id };

      return this.paginationService.paginate(
        this.emailRepository,
        whereClause,
        {
          ...options,
          order: { created_at: 'DESC' },
        }
      );
    } catch (error) {
      this.logger.error(`Error getting emails: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getEmail(id: string, userId: string, userEmail: string) {
    try {
      const user = await this.getUserWithCache(userId);

      const email = await this.emailRepository.createQueryBuilder('email')
        .where('email.id = :id', { id })
        .andWhere(
          '(email.to = :userEmail OR email.from LIKE :fromPattern)',
          { userEmail: user.email, fromPattern: `%${user.email}%` }
        )
        .getOne();

      if (!email) throw new NotFoundException(`Email with ID ${id} not found`);

      return email;
    } catch (error) {
      this.logger.error(`Error in getEmail: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Error accessing email: ${error.message}`);
    }
  }

  async replyToEmail(id: string, userId: string, fromEmail: string, replyEmailDto: ReplyEmailDto, files?: Express.Multer.File[]) {
    try {
      // Get user and original email concurrently
      const [user, originalEmail] = await Promise.all([
        this.getUserWithCache(userId),
        this.getEmail(id, userId, fromEmail)
      ]);

      const originalSenderEmail = this.extractEmail(originalEmail.from);

      // Prepare reply content
      const replySubject = originalEmail.subject.startsWith('Re:')
        ? originalEmail.subject
        : `Re: ${originalEmail.subject}`;

      const replyBody = `
        ${replyEmailDto.body}
        
        <hr>
        <p>On ${originalEmail.created_at.toLocaleString()}, ${originalEmail.from} wrote:</p>
        ${originalEmail.body}
      `;

      // Send reply
      const sendEmailDto = new SendEmailDto();
      sendEmailDto.to = originalSenderEmail;
      sendEmailDto.subject = replySubject;
      sendEmailDto.body = replyBody;
      sendEmailDto.attachments = replyEmailDto.attachments;
      sendEmailDto.cc = replyEmailDto.cc;
      sendEmailDto.bcc = replyEmailDto.bcc;

      return this.sendEmail(userId, user.email, sendEmailDto, files);
    } catch (error) {
      this.logger.error(`Error in replyToEmail: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteEmail(id: string, userId: string, userEmail: string) {
    try {

      await this.emailRepository
        .createQueryBuilder()
        .update(EmailAccount)
        .set({ folder: 'trash' })
        .where('id = :id', { id })
        .andWhere('userId = :userId', { userId })
        .execute();

      return { success: true, message: 'Email moved to trash' };
    } catch (error) {
      this.logger.error(`Error deleting email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async permanentlyDeleteEmail(id: string, userId: string, userEmail: string) {
    try {
      const email = await this.getEmail(id, userId, userEmail);

      if (email.folder !== 'trash') throw new Error('Email must be in trash before permanent deletion');

      await this.emailRepository
        .createQueryBuilder()
        .delete()
        .from(EmailAccount)
        .where('id = :id', { id })
        .andWhere('userId = :userId', { userId })
        .execute();

      return { success: true, message: 'Email permanently deleted' };
    } catch (error) {
      this.logger.error(`Error permanently deleting email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async emptyTrash(userId: string, userEmail: string) {
    try {

      const result = await this.emailRepository
        .createQueryBuilder()
        .delete()
        .from(EmailAccount)
        .where('folder = :folder', { folder: 'trash' })
        .andWhere('userId = :userId', { userId })
        .execute();

      return {
        success: true,
        message: `Successfully deleted ${result.affected} emails from trash`
      };
    } catch (error) {
      this.logger.error(`Error emptying trash: ${error.message}`, error.stack);
      throw error;
    }
  }
}