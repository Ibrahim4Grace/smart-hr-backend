import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { ReplyEmailDto } from './dto/reply-email.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { GetUser } from '@shared/decorators/user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';


@ApiTags('Email')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
  ) { }

  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 200, description: 'The email has been successfully sent.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  sendEmail(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() sendEmailDto: SendEmailDto,
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
  ) {
    return this.emailService.sendEmail(userId, userEmail, sendEmailDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all emails for the current user' })
  @ApiResponse({ status: 200, description: 'The emails have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'folder', required: false, enum: ['inbox', 'sent', 'drafts', 'trash'] })
  getEmails(
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('folder') folder = 'inbox',
  ) {
    return this.emailService.getEmails(userId, userEmail, { page, limit, folder });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific email by ID' })
  @ApiResponse({ status: 200, description: 'The email has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  getEmail(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
  ) {
    return this.emailService.getEmail(id, userId, userEmail);
  }

  @Post('reply/:id')
  @ApiOperation({ summary: 'Reply to an email' })
  @ApiResponse({ status: 200, description: 'The reply has been successfully sent.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  replyToEmail(
    @Param('id') id: string,
    @Body() replyEmailDto: ReplyEmailDto,
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
  ) {
    return this.emailService.replyToEmail(id, userId, userEmail, replyEmailDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an email' })
  @ApiResponse({ status: 200, description: 'The email has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  deleteEmail(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
  ) {
    return this.emailService.deleteEmail(id, userId, userEmail);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete an email from trash' })
  @ApiResponse({ status: 200, description: 'The email has been permanently deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  permanentlyDeleteEmail(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
  ) {
    return this.emailService.permanentlyDeleteEmail(id, userId, userEmail);
  }

  @Delete('trash/empty')
  @ApiOperation({ summary: 'Empty trash folder' })
  @ApiResponse({ status: 200, description: 'All emails in trash have been permanently deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  emptyTrash(
    @GetUser('userId') userId: string,
    @GetUser('email') userEmail: string,
  ) {
    return this.emailService.emptyTrash(userId, userEmail);
  }
}