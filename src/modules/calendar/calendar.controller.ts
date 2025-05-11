import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@guards/auth.guard';
import { GetUser } from '@shared/decorators/user.decorator';
import { UserPayload } from '@modules/user/interface/user.interface';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')

export class CalendarController {
  constructor(private readonly calendarService: CalendarService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({ status: 201, description: 'The event has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @GetUser('userId') userId: string,
    @Body() createCalendarDto: CreateCalendarDto) {
    return this.calendarService.create(createCalendarDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all calendar events' })
  @ApiResponse({ status: 200, description: 'Return all calendar events.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({ name: 'startTime', required: false, type: Date })
  @ApiQuery({ name: 'endTime', required: false, type: Date })
  findAll(
    @GetUser('userId') userId: string,
    @Query('startTime') startTime?: Date,
    @Query('endTime') endTime?: Date,
  ) {
    return this.calendarService.findAll(userId, startTime, endTime);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming calendar events' })
  @ApiResponse({ status: 200, description: 'Return upcoming calendar events.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findUpcoming(
    @GetUser('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.calendarService.findUpcoming(userId, limit);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get a calendar event by id' })
  @ApiResponse({ status: 200, description: 'Return the calendar event.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Calendar event not found.' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string) {
    return this.calendarService.findOne(id, userId);
  }

  @Patch(':calendarId')
  @ApiOperation({ summary: 'Update a calendar event' })
  @ApiResponse({ status: 200, description: 'The event has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Calendar event not found.' })
  update(
    @Param('calendarId') calendarId: string,
    @GetUser('userId') userId: string,
    @Body() updateCalendarDto: UpdateCalendarDto) {
    return this.calendarService.update(calendarId, userId, updateCalendarDto);
  }

  @Delete(':calendarId')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({ status: 200, description: 'The event has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Calendar event not found.' })
  remove(
    @Param('calendarId') calendarId: string,
    @GetUser('userId') userId: string) {
    return this.calendarService.remove(calendarId, userId);
  }
}
