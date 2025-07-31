import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { CreateAssetDto, DeleteAssetResponse } from './dto/create-asset.dto';
import { Employee } from '../employee/entities/employee.entity';
import { CacheService } from '../../shared/cache/cache.service';
import { CachePrefixesService } from '../../shared/cache/cache.prefixes.service';
import { BaseCacheableService } from '../../shared/services/base-cacheable.service';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset, AssetStatus } from './entities/asset.entity';
import { AssetFilterDto } from './dto/filter-asset.dto';
import { CloudinaryService } from '../../shared/services/cloudinary.service';

interface QueryResults {
  employee?: Employee | null;
  serial?: Asset | null;
}

@Injectable()
export class AssetsService extends BaseCacheableService {

  constructor(
    @InjectRepository(Asset) private assetRepository: Repository<Asset>,
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    private permissionsService: EntityPermissionsService,
    private readonly cloudinaryService: CloudinaryService,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService
  ) {
    super(cacheService, cachePrefixes);
  }

  async create(
    createAssetDto: CreateAssetDto,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const user = await this.permissionsService.getUserById(userId);
    const serialNumbers = createAssetDto.assets.map(asset => asset.serial_number);

    const existingAssets = await this.assetRepository.find({
      where: {
        serial_number: In(serialNumbers),
        added_by_hr: { id: user.id }
      }
    });

    if (existingAssets.length > 0) {
      const duplicates = existingAssets.map(asset => asset.serial_number);
      throw new BadRequestException(`Assets with these serial numbers already exist: ${duplicates.join(', ')}`);
    }

    // Create assets array
    const assets = [];

    for (let i = 0; i < createAssetDto.assets.length; i++) {
      const assetData = createAssetDto.assets[i];

      let asset_image_url: string | undefined;
      if (files && files[i]) {
        const file = files[i];
        asset_image_url = await this.cloudinaryService.uploadFile(file, 'assets');
      }

      const asset = this.assetRepository.create({
        type: assetData.type,
        serial_number: assetData.serial_number,
        cost: assetData.cost,
        purchase_date: assetData.purchase_date ? new Date(assetData.purchase_date) : null,
        warranty_period: assetData.warranty_period,
        purchase_from: assetData.purchase_from,
        asset_image_url,
        added_by_hr: { id: user.id }
      });

      assets.push(asset);
    }

    await this.assetRepository.save(assets);
    await this.invalidateOnCreate(userId, this.cachePrefixes.ASSET);

    return {
      message: `${assets.length} asset${assets.length > 1 ? 's' : ''} created successfully`,
      created_count: assets.length
    };
  }

  async findAllByFilters(
    paginationOptions: PaginationOptions<Asset>,
    userId: string,
    filters?: AssetFilterDto
  ) {
    const user = await this.permissionsService.getUserById(userId);
    const cacheKey = this.generatePaginationCacheKey(userId, paginationOptions, filters);

    return this.cacheResult(
      this.cachePrefixes.ASSET_LIST,
      cacheKey,
      async () => {
        // Build where conditions
        const whereConditions: any = { added_by_hr: { id: user.id } };

        if (filters?.status) {
          whereConditions.status = filters.status;
        }

        const page = Number(paginationOptions.page) || 1;
        const limit = Number(paginationOptions.limit) || 9;
        const skip = (page - 1) * limit;

        //select specific fields
        const queryBuilder = this.assetRepository
          .createQueryBuilder('asset')
          .leftJoinAndSelect('asset.assigned_to', 'assigned_to')
          .select([
            'asset.id',
            'asset.type',
            'asset.serial_number',
            'asset.cost',
            'asset.status',
            'asset.purchase_date',
            'asset.warranty_period',
            'asset.purchase_from',
            'asset.asset_image_url',
            'assigned_to.id',
            'assigned_to.first_name',
            'assigned_to.last_name'
          ])
          .where('asset.added_by_hr_id = :userId', { userId: user.id });

        if (filters?.status) {
          queryBuilder.andWhere('asset.status = :status', { status: filters.status });
        }

        if (filters?.purchaseDateFrom) {
          queryBuilder.andWhere('asset.purchase_date >= :purchaseDateFrom', {
            purchaseDateFrom: filters.purchaseDateFrom
          });
        }

        if (filters?.purchaseDateTo) {
          queryBuilder.andWhere('asset.purchase_date <= :purchaseDateTo', {
            purchaseDateTo: filters.purchaseDateTo
          });
        }

        const [data, total] = await queryBuilder
          .skip(skip)
          .take(limit)
          .getManyAndCount();

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      },
      this.cacheService.CACHE_TTL.MEDIUM
    );
  }

  async findOne(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    return this.cacheResult(
      this.cachePrefixes.ASSET_BY_ID,
      id,
      async () => {
        const asset = await this.permissionsService.getEntityWithPermissionCheck(
          Asset, id, user, ['added_by_hr', 'assigned_to']
        );
        return {
          ...asset,
          assigned_to: asset.assigned_to ? {
            id: asset.assigned_to.id,
            name: asset.assigned_to.name
          } : null,
          added_by_hr: asset.added_by_hr ? {
            id: asset.added_by_hr.id,
            name: asset.added_by_hr.name
          } : null,
        };
      },
      this.cacheService.CACHE_TTL.LONG
    );
  }

  async update(
    id: string,
    UpdateAssetDto: Partial<UpdateAssetDto>,
    userId: string,
    file?: Express.Multer.File
  ) {
    const user = await this.permissionsService.getUserById(userId);
    const asset = await this.permissionsService.getEntityWithPermissionCheck(
      Asset,
      id,
      user,
      ['added_by_hr', 'assigned_to']
    );

    // Parallelize independent operations
    const operations = [];

    if (UpdateAssetDto.employee_id) {
      operations.push(['employee', this.employeeRepository.findOne({
        where: { id: UpdateAssetDto.employee_id }
      })]);
    }

    if (UpdateAssetDto.serial_number && UpdateAssetDto.serial_number !== asset.serial_number) {
      operations.push(['serial', this.assetRepository.findOne({
        where: {
          serial_number: UpdateAssetDto.serial_number,
          added_by_hr: { id: user.id },
          id: Not(id)
        }
      })]);
    }

    // Execute parallel operations
    const results: QueryResults = {};
    if (operations.length > 0) {
      const resolved = await Promise.all(operations.map(([, promise]) => promise));
      operations.forEach(([key], index) => {
        results[key] = resolved[index];
      });
    }

    if (UpdateAssetDto.employee_id && !results.employee) {
      throw new BadRequestException('Employee not found');
    }

    if (results.serial) {
      throw new BadRequestException('Asset with this serial number already exists.');
    }

    // Handle employee assignment logic
    if (UpdateAssetDto.employee_id !== undefined) {
      if (UpdateAssetDto.employee_id) {
        // Check if already assigned to this employee
        if (asset.assigned_to && asset.assigned_to.id === UpdateAssetDto.employee_id) {
          throw new BadRequestException('This asset is already assigned to this employee');
        }

        // Assign to new employee
        asset.assigned_to = results.employee;
        asset.status = AssetStatus.ASSIGNED;
        asset.assigned_at = new Date();
      } else {
        // Unassign from current employee
        asset.assigned_to = null;
        asset.status = AssetStatus.AVAILABLE;
        asset.assigned_at = null;
      }
    }

    // Handle file upload
    let asset_image_url = asset.asset_image_url;
    if (file) {
      if (asset_image_url) {
        const publicId = this.cloudinaryService.getPublicIdFromUrl(asset_image_url);
        await this.cloudinaryService.deleteFile(publicId);
      }
      asset_image_url = await this.cloudinaryService.uploadFile(file, 'assets');
    }

    const { employee_id, ...otherFields } = UpdateAssetDto;
    Object.assign(asset, otherFields, { asset_image_url });

    await this.assetRepository.save(asset);
    await this.invalidateOnUpdate(id, userId, this.cachePrefixes.ASSET);

    return {
      message: 'Asset updated successfully'
    };
  }

  async remove(id: string, userId: string): Promise<DeleteAssetResponse> {
    const user = await this.permissionsService.getUserById(userId);
    const asset = await this.permissionsService.getEntityWithPermissionCheck(
      Asset,
      id,
      user,
      ['added_by_hr']
    );

    if (asset.assigned_to) {
      const employee = asset.assigned_to;
      if (employee.added_by_hr && employee.added_by_hr.id === user.id) {
        throw new BadRequestException(
          `Cannot delete asset "${asset.serial_number}" because it is assigned to an employee. Please reassign or remove the assignment before deleting the asset.`
        );
      }
    }

    if (asset.asset_image_url) {
      const publicId = this.cloudinaryService.getPublicIdFromUrl(asset.asset_image_url);
      await this.cloudinaryService.deleteFile(publicId);
    }

    await this.assetRepository.remove(asset);
    await this.invalidateOnDelete(id, userId, this.cachePrefixes.ASSET);

    return {
      message: 'Asset deleted successfully'
    };
  }
}
