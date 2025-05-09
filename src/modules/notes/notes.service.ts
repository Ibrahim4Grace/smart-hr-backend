import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note, NotePriority } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { PaginationService } from '../../shared/services/pagination.service';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { EntityPermissionsService } from '../../shared/services/permissions.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    private readonly paginationService: PaginationService,
    private readonly permissionsService: EntityPermissionsService,
  ) { }

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<Note> {
    const user = await this.permissionsService.getUserById(userId);
    const note = this.noteRepository.create({
      ...createNoteDto,
      user: { id: user.id }
    });

    return this.noteRepository.save(note);
  }

  async findAll(paginationOptions: PaginationOptions<Note>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    return this.paginationService.paginate(this.noteRepository,
      { user: { id: user.id } },
      {
        ...paginationOptions,
        relations: ['user'],
      }
    );
  }

  async findOne(id: string, userId: string): Promise<Note> {
    const user = await this.permissionsService.getUserById(userId);
    return this.permissionsService.getEntityWithPermissionCheck(
      Note,
      id,
      user
    );
  }

  async update(id: string, updateNoteDto: Partial<CreateNoteDto>, userId: string): Promise<Note> {
    const user = await this.permissionsService.getUserById(userId);
    const note = await this.permissionsService.getEntityWithPermissionCheck(
      Note,
      id,
      user
    );

    const updatedNote = { ...note, ...updateNoteDto };
    return this.noteRepository.save(updatedNote);
  }

  async findByPriority(userId: string, priority: NotePriority, paginationOptions: PaginationOptions<Note>) {
    const user = await this.permissionsService.getUserById(userId);
    return this.paginationService.paginate(
      this.noteRepository,
      { user: { id: user.id }, priority },
      {
        ...paginationOptions,
        relations: ['user']
      }
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const user = await this.permissionsService.getUserById(userId);
    const note = await this.permissionsService.getEntityWithPermissionCheck(
      Note,
      id,
      user
    );
    await this.noteRepository.remove(note);
  }
}
