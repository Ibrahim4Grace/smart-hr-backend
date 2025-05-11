import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Chat } from './entities/chat.entity';
import { Employee } from '../employee/entities/employee.entity';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { CloudinaryService } from '@shared/services/cloudinary.service';
import { NotificationGateway } from '@shared/notification/notification.gateway';
import { CreateChatDto } from './dto/create-chat.dto';
import { UserRole } from '@modules/auth/interfaces/auth.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private permissionsService: EntityPermissionsService,
    private cloudinaryService: CloudinaryService,
    private notificationGateway: NotificationGateway,
  ) { }

  // HR can only chat with employees they've added
  async getHREmployeeChatList(hrId: string): Promise<any[]> {
    const hr = await this.permissionsService.getUserById(hrId);
    if (hr.role !== UserRole.HR) {
      throw new BadRequestException('User is not an HR');
    }

    // Get employees added by this HR
    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.added_by_hr_id = :hrId', { hrId })
      .getMany();

    // For each employee, find or create a chat room
    const chatList = await Promise.all(
      employees.map(async (employee) => {
        const chatRoom = await this.findOrCreateChatRoom(hrId, employee.id);

        // Get the last message in this chat room (if any)
        const lastMessage = await this.chatRepository.findOne({
          where: { chatRoom: { id: chatRoom.id } },
          order: { created_at: 'DESC' },
        });

        return {
          employeeId: employee.id,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          profilePicUrl: employee.employee_profile_pic_url,
          chatRoomId: chatRoom.id,
          lastMessage: lastMessage ? lastMessage.message : null,
          lastMessageTime: lastMessage ? lastMessage.created_at : null
        };
      })
    );

    // Sort by last message time (most recent first)
    return chatList.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }

  // Find or create a chat room between HR and employee
  async findOrCreateChatRoom(hrId: string, employeeId: string): Promise<ChatRoom> {
    // Verify HR exists
    const hr = await this.permissionsService.getUserById(hrId);

    // Verify employee exists and is added by this HR
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, added_by_hr: { id: hrId } }
    });

    if (!employee) {
      throw new BadRequestException('Invalid HR-employee relationship');
    }

    // First try to find an existing chat room
    const existingChatRoom = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .leftJoin('chatRoom.participants', 'participant')
      .where('participant.id IN (:...ids)', { ids: [hrId, employeeId] })
      .groupBy('chatRoom.id')
      .having('COUNT(DISTINCT participant.id) = 2')
      .andHaving('COUNT(participant.id) = 2')
      .getOne();

    if (existingChatRoom) {
      return existingChatRoom;
    }

    // If no existing chat room, create a new one
    const chatRoom = this.chatRoomRepository.create({
      name: `Chat with ${employee.first_name} ${employee.last_name}`,
      participants: [
        { id: hrId },
        { id: employeeId }
      ],
    });

    return this.chatRoomRepository.save(chatRoom);
  }

  // Send a message
  async sendMessage(createChatDto: CreateChatDto, senderId: string): Promise<Chat> {
    // Verify sender exists
    const sender = await this.permissionsService.getUserById(senderId);

    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: createChatDto.chatRoomId },
      relations: ['participants'],
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    // Check if sender is a participant
    const isParticipant = chatRoom.participants.some(p => p.id === senderId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat room');
    }

    // If sender is HR, verify they can chat with the employee
    if (sender.role === UserRole.HR) {
      const otherParticipant = chatRoom.participants.find(p => p.id !== senderId);
      if (otherParticipant) {
        const employee = await this.employeeRepository.findOne({
          where: { id: otherParticipant.id, added_by_hr: { id: senderId } }
        });

        if (!employee) {
          throw new BadRequestException('You can only chat with employees you added');
        }
      }
    }

    const chat = this.chatRepository.create({
      message: createChatDto.message,
      fileUrl: createChatDto.fileUrl,
      sender: { id: senderId },
      chatRoom,
    });

    const savedChat = await this.chatRepository.save(chat);

    // Notify other participants
    chatRoom.participants.forEach(participant => {
      if (participant.id !== senderId) {
        this.notificationGateway.sendNotification(participant.id, {
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: `You have a new message`,
          data: { chatId: savedChat.id, chatRoomId: chatRoom.id },
        });
      }
    });

    return savedChat;
  }

  // Get messages from a chat room
  async getChatMessages(chatRoomId: string, userId: string): Promise<Chat[]> {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
      relations: ['participants'],
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const isParticipant = chatRoom.participants.some(p => p.id === userId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat room');
    }

    // If user is HR, verify they can access this chat
    const user = await this.permissionsService.getUserById(userId);
    if (user.role === UserRole.HR) {
      const otherParticipant = chatRoom.participants.find(p => p.id !== userId);
      if (otherParticipant) {
        const employee = await this.employeeRepository.findOne({
          where: { id: otherParticipant.id, added_by_hr: { id: userId } }
        });

        if (!employee) {
          throw new BadRequestException('You can only view chats with employees you added');
        }
      }
    }

    return this.chatRepository.find({
      where: { chatRoom: { id: chatRoomId } },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  // Upload a file for a chat
  async uploadFile(file: Express.Multer.File, chatRoomId: string, userId: string): Promise<Chat> {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
      relations: ['participants'],
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    const isParticipant = chatRoom.participants.some(p => p.id === userId);
    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this chat room');
    }

    // If user is HR, verify they can access this chat
    const user = await this.permissionsService.getUserById(userId);
    if (user.role === UserRole.HR) {
      const otherParticipant = chatRoom.participants.find(p => p.id !== userId);
      if (otherParticipant) {
        const employee = await this.employeeRepository.findOne({
          where: { id: otherParticipant.id, added_by_hr: { id: userId } }
        });

        if (!employee) {
          throw new BadRequestException('You can only chat with employees you added');
        }
      }
    }

    // Upload file to Cloudinary
    const fileUrl = await this.cloudinaryService.uploadFile(file, 'chat-files');

    const chat = this.chatRepository.create({
      message: 'Shared a file',
      fileUrl,
      sender: { id: userId },
      chatRoom,
    });

    const savedChat = await this.chatRepository.save(chat);

    // Notify other participants
    chatRoom.participants.forEach(participant => {
      if (participant.id !== userId) {
        this.notificationGateway.sendNotification(participant.id, {
          type: 'FILE_UPLOADED',
          title: 'File Uploaded',
          message: 'A new file has been shared',
          data: { chatId: savedChat.id, chatRoomId: chatRoom.id },
        });
      }
    });

    return savedChat;
  }

  // Delete a message
  async deleteMessage(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['sender', 'chatRoom', 'chatRoom.participants'],
    });

    if (!chat) {
      throw new NotFoundException('Message not found');
    }

    if (chat.sender.id !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    // If there's a file, delete it from Cloudinary
    if (chat.fileUrl) {
      const publicId = this.cloudinaryService.getPublicIdFromUrl(chat.fileUrl);
      await this.cloudinaryService.deleteFile(publicId);
    }

    await this.chatRepository.remove(chat);

    // Notify other participants about the deletion
    chat.chatRoom.participants.forEach(participant => {
      if (participant.id !== userId) {
        this.notificationGateway.sendNotification(participant.id, {
          type: 'MESSAGE_DELETED',
          title: 'Message Deleted',
          message: 'A message has been deleted',
          data: { chatRoomId: chat.chatRoom.id },
        });
      }
    });
  }
}