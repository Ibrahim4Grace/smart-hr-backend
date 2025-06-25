import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { GetUser } from '@shared/decorators/user.decorator';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { Note, NotePriority } from './entities/note.entity';
import { PriorityValidationPipe } from '@modules/notes/pipe/prioritypipe.validation';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR, UserRole.EMPLOYEE)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'The note has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createNoteDto: CreateNoteDto, @GetUser('userId') userId: string,) {
    return this.notesService.create(createNoteDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes' })
  @ApiResponse({ status: 200, description: 'The notes have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Note>,
    @GetUser('userId') userId: string,) {
    return this.notesService.findAll(paginationOptions, userId);
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Get notes filtered by priority for the current user' })
  @ApiResponse({ status: 200, description: 'Return notes filtered by priority.' })
  @ApiParam({ name: 'priority', enum: NotePriority, description: 'Filter notes by priority (Low, Medium, High)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  findByPriority(
    @Param('priority', PriorityValidationPipe) priority: NotePriority,
    @GetUser('userId') userId: string,
    @Query() paginationOptions: PaginationOptions<Note>
  ) {
    return this.notesService.findByPriority(userId, priority, paginationOptions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiResponse({ status: 200, description: 'The note has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @GetUser('userId') userId: string,) {
    return this.notesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note by ID' })
  @ApiResponse({ status: 200, description: 'The note has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() updateNoteDto: Partial<CreateNoteDto>,
  ) {
    return this.notesService.update(id, updateNoteDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note by ID' })
  @ApiResponse({ status: 200, description: 'The note has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @GetUser('userId') userId: string,) {
    return this.notesService.remove(id, userId);
  }
}
