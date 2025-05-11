import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { GetUser } from '@shared/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { AuthGuard } from '@guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Todo, TodoPriority } from './entities/todo.entity';
import { PriorityValidationPipe } from './pipe/prioritypipe.validation';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';


@ApiTags('Todos')
@ApiBearerAuth()
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiBody({ type: CreateTodoDto })
  @ApiResponse({ status: 201, description: 'Todo created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  create(
    @GetUser('userId') userId: string,
    @Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos for the authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Return all todos' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Todo>,
    @GetUser('userId') userId: string
  ) {
    return this.todoService.findAll(paginationOptions, userId);
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Get todos filtered by priority for the current user' })
  @ApiResponse({ status: 200, description: 'Return todos filtered by priority.' })
  @ApiParam({ name: 'priority', enum: TodoPriority, description: 'Filter todos by priority (Low, Medium, High)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  findByPriority(
    @Param('priority', PriorityValidationPipe) priority: TodoPriority,
    @GetUser('userId') userId: string,
    @Query() paginationOptions: PaginationOptions<Todo>
  ) {
    return this.todoService.findByPriority(userId, priority, paginationOptions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo by id' })
  @ApiResponse({ status: 200, description: 'Return the todo' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string
  ) {
    return this.todoService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiBody({ type: UpdateTodoDto })
  @ApiResponse({ status: 200, description: 'Todo updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @GetUser('userId') userId: string
  ) {
    return this.todoService.update(id, updateTodoDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiResponse({ status: 200, description: 'Todo deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string
  ) {
    return this.todoService.remove(id, userId);
  }
}
