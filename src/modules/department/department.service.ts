import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDepartmentDto, DeleteDepartmentResponse } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
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
export class DepartmentService extends BaseCacheableService {

  constructor(
    @InjectRepository(Department) private deptRepository: Repository<Department>,
    private permissionsService: EntityPermissionsService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly paginationService: PaginationService,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService
  ) {
    super(cacheService, cachePrefixes);
  }


  async create(createDepartmentDto: CreateDepartmentDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const existing = await this.deptRepository.findOne({
      where: {
        name: createDepartmentDto.name,
        added_by_hr: { id: user.id }
      }
    });

    if (existing) {
      throw new BadRequestException('Department with this name already exists.');
    }


    const department = this.deptRepository.create({
      ...createDepartmentDto,
      added_by_hr: { id: user.id }
    });

    await this.deptRepository.save(department);
    await this.invalidateOnCreate(userId, this.cachePrefixes.DEPARTMENT);

    return {
      message: 'Department created successfully'
    };
  }

  async findAll(paginationOptions: PaginationOptions<Department>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const cacheKey = this.generatePaginationCacheKey(userId, paginationOptions);

    return this.cacheResult(
      this.cachePrefixes.DEPARTMENT_LIST,
      cacheKey,
      async () => {
        return this.paginationService.paginate(this.deptRepository,
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
      this.cachePrefixes.DEPARTMENT_BY_ID,
      id,
      async () => {
        const department = await this.permissionsService.getEntityWithPermissionCheck(
          Department, id, user, ['added_by_hr']
        );
        return {
          ...department,
          added_by_hr: department.added_by_hr
            ? { id: department.added_by_hr.id, name: department.added_by_hr.name }
            : null,
        };
      },
      this.cacheService.CACHE_TTL.LONG
    );
  }

  async update(id: string, UpdateDepartmentDto: Partial<UpdateDepartmentDto>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const dept = await this.permissionsService.getEntityWithPermissionCheck(
      Department,
      id,
      user,
      ['added_by_hr']
    );
    const updatedDept = {
      ...dept,
      ...UpdateDepartmentDto,
    };

    await this.deptRepository.save(updatedDept);
    await this.invalidateOnUpdate(id, userId, this.cachePrefixes.DEPARTMENT);

    return {
      message: 'Department updated successfully',
    };
  }

  async remove(id: string, userId: string): Promise<DeleteDepartmentResponse> {
    const user = await this.permissionsService.getUserById(userId);
    const dept = await this.permissionsService.getEntityWithPermissionCheck(
      Department,
      id,
      user,
      ['added_by_hr']
    );

    await this.deptRepository.remove(dept);
    await this.invalidateOnDelete(id, userId, this.cachePrefixes.DEPARTMENT);

    return {
      message: 'Department deleted successfully'
    };
  }
}
