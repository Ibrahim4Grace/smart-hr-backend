import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { Calendar } from './entities/calendar.entity';
import { User } from '../user/entities/user.entity';
import { EntityPermissionsService } from '@shared/services/permissions.service';
import { Todo } from '@modules/todo/entities/todo.entity';



@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly permissionsService: EntityPermissionsService,
  ) { }

  async create(createCalendarDto: CreateCalendarDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = this.calendarRepository.create({
      ...createCalendarDto,
      user: { id: user.id }
    });
    return await this.calendarRepository.save(calendar);
  }

  async findAll(userId: string, startTime?: Date, endTime?: Date) {
    const queryOptions: any = {
      where: { user: { id: userId } },
      order: {
        startTime: 'ASC',
      },
      relations: ['user'],
    };

    if (startTime && endTime) {
      queryOptions.where = {
        ...queryOptions.where,
        startTime: Between(startTime, endTime),
      };
    }

    return await this.calendarRepository.find(queryOptions);
  }

  async findOne(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    return this.permissionsService.getEntityWithPermissionCheck(Calendar, id, user);
  }

  async update(calendarId: string, userId: string, updateCalendarDto: UpdateCalendarDto) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = await this.permissionsService.getEntityWithPermissionCheck(Calendar, calendarId, user);
    const updatedCalendar = { ...calendar, ...updateCalendarDto };

    return this.calendarRepository.save(updatedCalendar);
  }

  async remove(calendarId: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = await this.permissionsService.getEntityWithPermissionCheck(Calendar, calendarId, user);
    await this.calendarRepository.remove(calendar);

  }

  async findUpcoming(userId: string, limit: number = 5) {
    const now = new Date();
    return await this.calendarRepository.find({
      where: {
        user: { id: userId },
        startTime: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)), // Next 30 days
      },
      order: {
        startTime: 'ASC',
      },
      take: limit,
      relations: ['user'],
    });
  }
}