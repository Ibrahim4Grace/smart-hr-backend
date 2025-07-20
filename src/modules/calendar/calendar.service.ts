import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { Calendar } from './entities/calendar.entity';
import { User } from '../user/entities/user.entity';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { PaginationService } from '../../shared/services/pagination.service';
import { BaseCacheableService } from '../../shared/services/base-cacheable.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CachePrefixesService } from '../../shared/cache/cache.prefixes.service';

@Injectable()
export class CalendarService extends BaseCacheableService {
  protected readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    private readonly permissionsService: EntityPermissionsService,
    private readonly paginationService: PaginationService,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService
  ) {
    super(cacheService, cachePrefixes);
  }

  async create(createCalendarDto: CreateCalendarDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = this.calendarRepository.create({
      ...createCalendarDto,
      user: { id: user.id }
    });
    await this.calendarRepository.save(calendar);
    await this.invalidateOnCreate(userId, this.cachePrefixes.CALENDAR);
    return {
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

    const cacheKey = this.generatePaginationCacheKey(userId, { page, limit, startTime, endTime });
    return this.cacheResult(
      this.cachePrefixes.CALENDAR_LIST,
      cacheKey,
      async () => {
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
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  async findOne(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const calender = await this.cacheResult(
      this.cachePrefixes.CALENDAR_BY_ID,
      id,
      async () => this.permissionsService.getEntityWithPermissionCheck(Calendar, id, user),
      this.cacheService.CACHE_TTL.LONG
    );
    if (calender && calender.user) {
      delete calender.user;
    }
    return calender;
  }

  async update(calendarId: string, userId: string, updateCalendarDto: UpdateCalendarDto) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = await this.permissionsService.getEntityWithPermissionCheck(Calendar, calendarId, user);
    const updatedCalendar = { ...calendar, ...updateCalendarDto };

    await this.calendarRepository.save(updatedCalendar);
    await this.invalidateOnUpdate(calendarId, userId, this.cachePrefixes.CALENDAR);
    return {
      message: 'Event updated successfully',
    }
  }

  async remove(calendarId: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const calendar = await this.permissionsService.getEntityWithPermissionCheck(Calendar, calendarId, user);
    await this.calendarRepository.remove(calendar);
    await this.invalidateOnDelete(calendarId, userId, this.cachePrefixes.CALENDAR);
    return { message: 'Event deleted successfully' };
  }


  async findUpcoming(userId: string, limit: number = 5) {
    const now = new Date();
    const cacheKey = this.generatePaginationCacheKey(userId, { limit, now });
    return this.cacheResult(
      this.cachePrefixes.CALENDAR_LIST,
      `upcoming:${cacheKey}`,
      async () => {
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
          count: events.length,
          data: events,
        };
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }



}