import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './entities/todo.entity';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { SharedModule } from '@shared/shared.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Todo, User]),
    SharedModule
  ],
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService]
})
export class TodoModule { }
