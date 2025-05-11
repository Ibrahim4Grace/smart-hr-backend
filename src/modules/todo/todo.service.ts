import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo, TodoPriority } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PaginationService } from '@shared/services/pagination.service';
import { EntityPermissionsService } from '@shared/services/permissions.service';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly paginationService: PaginationService,
    private readonly permissionsService: EntityPermissionsService,
  ) { }

  async create(createTodoDto: CreateTodoDto, userId: string): Promise<Todo> {
    const user = await this.permissionsService.getUserById(userId);
    const todo = this.todoRepository.create({
      ...createTodoDto,
      user: { id: user.id }
    });

    return this.todoRepository.save(todo);
  }

  async findAll(paginationOptions: PaginationOptions<Todo>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    return this.paginationService.paginate(this.todoRepository,
      { user: { id: user.id } },
      {
        ...paginationOptions,
        relations: ['user'],
      }
    );
  }

  async findOne(id: string, userId: string): Promise<Todo> {
    const user = await this.permissionsService.getUserById(userId);
    return this.permissionsService.getEntityWithPermissionCheck(Todo, id, user);
  }

  async update(id: string, updateTodoDto: UpdateTodoDto, userId: string): Promise<Todo> {
    const user = await this.permissionsService.getUserById(userId);
    const todo = await this.permissionsService.getEntityWithPermissionCheck(Todo, id, user);
    const updatedTodo = { ...todo, ...updateTodoDto };

    return this.todoRepository.save(updatedTodo);
  }

  async findByPriority(userId: string, priority: TodoPriority, paginationOptions: PaginationOptions<Todo>) {
    const user = await this.permissionsService.getUserById(userId);
    return this.paginationService.paginate(
      this.todoRepository,
      { user: { id: user.id }, priority },
      {
        ...paginationOptions,
        relations: ['user']
      }
    );
  }


  async remove(id: string, userId: string): Promise<void> {
    const user = await this.permissionsService.getUserById(userId);
    const todo = await this.permissionsService.getEntityWithPermissionCheck(Todo, id, user);
    await this.todoRepository.remove(todo);
  }
}