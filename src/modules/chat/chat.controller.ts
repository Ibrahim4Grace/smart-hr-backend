import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { ApiBearerAuth, ApiResponse, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '@shared/decorators/user.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }


  @Get('employees')
  @ApiOperation({ summary: 'Get chat list with employees' })
  @ApiResponse({ status: 200, description: 'Returns list of employees with chat info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHREmployeeChatList(@GetUser('userId') userId: string,) {
    return this.chatService.getHREmployeeChatList(userId);
  }


  @Post(':employeeId')
  @ApiOperation({ summary: 'Start or continue a chat with an employee' })
  @ApiResponse({ status: 200, description: 'Returns the chat room' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async startChat(
    @Param('employeeId') employeeId: string,
    @GetUser('userId') userId: string,) {
    return this.chatService.findOrCreateChatRoom(userId, employeeId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message in a chat room' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendMessage(
    @Body() createChatDto: CreateChatDto,
    @GetUser('userId') userId: string,) {
    return this.chatService.sendMessage(createChatDto, userId);
  }

  @Get('messages/:chatRoomId')
  @ApiOperation({ summary: 'Get messages for a specific chat room' })
  @ApiResponse({ status: 200, description: 'Returns messages from a chat room' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getChatMessages(
    @Param('chatRoomId') chatRoomId: string,
    @GetUser('userId') userId: string,) {
    return this.chatService.getChatMessages(chatRoomId, userId);
  }


  @Post('upload/:chatRoomId')
  @ApiOperation({ summary: 'Upload a file to a chat room' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('chatRoomId') chatRoomId: string,
    @GetUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.chatService.uploadFile(file, chatRoomId, userId);
  }

  @Delete('messages/:chatId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteMessage(
    @Param('chatId') chatId: string,
    @GetUser('userId') userId: string,) {
    await this.chatService.deleteMessage(chatId, userId);
    return { message: 'Message deleted successfully' };
  }

  // @Post('upload/:chatRoomId')
  // @ApiOperation({ summary: 'Upload a file to a chat room' })
  // @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 500, description: 'Internal server error' })
  // @UseInterceptors(FileInterceptor('file'))
  // uploadFile(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Param('chatRoomId') chatRoomId: string,
  //   @GetUser('userId') userId: string,
  // ) {
  //   return this.chatService.uploadFile(file, chatRoomId, userId);
  // }


}
