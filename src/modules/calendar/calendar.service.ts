import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { Calendar } from './entities/calendar.entity';
import { User } from '../user/entities/user.entity';
import { EntityPermissionsService } from '@shared/services/permissions.service';
import { PaginationService } from '@shared/services/pagination.service';
import { SSEService } from '@shared/sse/sse.service';




@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    private readonly permissionsService: EntityPermissionsService,
    private readonly paginationService: PaginationService,
    private readonly sseService: SSEService,
  ) { }

  async create(createCalendarDto: CreateCalendarDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = this.calendarRepository.create({
      ...createCalendarDto,
      user: { id: user.id }
    });
    await this.calendarRepository.save(calendar);
    return {
      statusCode: 201,
      message: 'Event created successfully',
    };
  }


  async findAll(userId: string, startTime?: Date, endTime?: Date, page = 1, limit = 10) {
    const where: any = { user: { id: userId } };
    if (startTime && endTime) {
      where.event_date = Between(startTime, endTime);
    }
    const select: (keyof Calendar)[] = [
      'id',
      'title',
      'event_date',
      'start_time',
      'end_time',
      'location',
      'description',
    ];

    return this.paginationService.paginate(
      this.calendarRepository,
      where,
      {
        page,
        limit,
        order: { start_time: 'ASC' },
        select
      }
    );
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
    const events = await this.calendarRepository.find({
      where: {
        user: { id: userId },
        event_date: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
      },
      order: {
        start_time: 'ASC',
      },
      take: limit,
      select: [
        'id',
        'title',
        'event_date',
        'start_time',
        'end_time',
        'location',
        'description',
      ],
    });
    return {
      status_code: 200,
      data: events,
    };
  }


  // async findUpcoming(userId: string, limit: number = 5) {
  //   const now = new Date();
  //   const events = await this.calendarRepository.find({
  //     where: {
  //       user: { id: userId },
  //       event_date: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
  //     },
  //     order: {
  //       start_time: 'ASC',
  //     },
  //     take: limit,
  //     select: [
  //       'id',
  //       'title',
  //       'event_date',
  //       'start_time',
  //       'end_time',
  //       'location',
  //       'description',
  //     ],
  //   });
  //   return {
  //     status_code: 200,
  //     data: events,
  //   };
  // }
}