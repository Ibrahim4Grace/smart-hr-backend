import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDesignationDto, DeleteDesignationResponse } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { Designation } from './entities/designation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { User } from '../user/entities/user.entity';
import { PaginationService } from '../../shared/services/pagination.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CachePrefixesService } from '../../shared/cache/cache.prefixes.service';
import { BaseCacheableService } from '../../shared/services/base-cacheable.service';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';

@Injectable()
export class DesignationService extends BaseCacheableService {
  constructor(
    @InjectRepository(Designation) private designationRepository: Repository<Designation>,
    private permissionsService: EntityPermissionsService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly paginationService: PaginationService,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService
  ) {
    super(cacheService, cachePrefixes);
  }


  async create(createDesignationDto: CreateDesignationDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const existing = await this.designationRepository.findOne({
      where: {
        name: createDesignationDto.name,
        added_by_hr: { id: user.id }
      }
    });

    if (existing) {
      throw new BadRequestException('Designation with this name already exists.');
    }

    const designation = this.designationRepository.create({
      ...createDesignationDto,
      added_by_hr: { id: user.id }
    });

    await this.designationRepository.save(designation);
    await this.invalidateOnCreate(userId, this.cachePrefixes.DESIGNATION);

    return {
      message: 'Designation created successfully'
    };
  }

  async findAll(paginationOptions: PaginationOptions<Designation>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const cacheKey = this.generatePaginationCacheKey(userId, paginationOptions);

    return this.cacheResult(
      this.cachePrefixes.DESIGNATION_LIST,
      cacheKey,
      async () => {
        return this.paginationService.paginate(this.designationRepository,
          { added_by_hr: { id: user.id } },
          {
            ...paginationOptions
          }
        );
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  async findOne(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    return this.cacheResult(
      this.cachePrefixes.DESIGNATION_BY_ID,
      id,
      async () => {
        const designation = await this.permissionsService.getEntityWithPermissionCheck(
          Designation, id, user, ['added_by_hr']);
        return {
          ...designation,
          added_by_hr: designation.added_by_hr
            ? { id: designation.added_by_hr.id, name: designation.added_by_hr.name }
            : null,
        };
      },
      this.cacheService.CACHE_TTL.LONG
    );
  }

  async update(id: string, UpdateDesignationDto: Partial<UpdateDesignationDto>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const designation = await this.permissionsService.getEntityWithPermissionCheck(
      Designation,
      id,
      user,
      ['added_by_hr']
    );
    const updatedDesignation = {
      ...designation,
      ...UpdateDesignationDto,
    };

    await this.designationRepository.save(updatedDesignation);
    await this.invalidateOnUpdate(id, userId, this.cachePrefixes.DESIGNATION);

    return {
      message: 'Designation updated successfully'
    };
  }

  async remove(id: string, userId: string): Promise<DeleteDesignationResponse> {
    const user = await this.permissionsService.getUserById(userId);
    const designation = await this.permissionsService.getEntityWithPermissionCheck(
      Designation,
      id,
      user,
      ['added_by_hr']
    );

    await this.designationRepository.remove(designation);
    await this.invalidateOnDelete(id, userId, this.cachePrefixes.DESIGNATION);

    return {
      message: 'Designation deleted successfully'
    };
  }
}
