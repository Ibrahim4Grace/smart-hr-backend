import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Pricing } from './entities/pricing.entity';
import { PaginationService } from '@shared/services/pagination.service';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { AccessType, Region } from './interface/price.interface';
import { CacheService } from '@shared/cache/cache.service';
import { CachePrefixesService } from '@shared/cache/cache.prefixes.service';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
    private paginationService: PaginationService,
    private cacheService: CacheService,
    private cachePrefixes: CachePrefixesService,
  ) { }

  async create(createPricingDto: CreatePricingDto) {
    try {
      const existingPlan = await this.pricingRepository.findOne({
        where: {
          plan_name: createPricingDto.plan_name,
          region: createPricingDto.region,
          access_type: createPricingDto.access_type,
          isActive: true
        }
      });

      if (existingPlan) throw new CustomHttpException(SYS_MSG.DUPLICATE_PRICING, HttpStatus.CONFLICT);

      const pricing = this.pricingRepository.create(createPricingDto);
      await this.pricingRepository.save(pricing);
      // Invalidate pricing list cache
      await this.cacheService.deleteByPrefix(this.cachePrefixes.PRICING_LIST);
      return { message: 'Pricing plan created successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to create pricing plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(options: PaginationOptions<Pricing> = {}) {
    try {
      const cacheKey = JSON.stringify(options);
      return await this.cacheService.getOrSet(
        this.cachePrefixes.PRICING_LIST,
        cacheKey,
        async () => {
          return await this.paginationService.paginate(
            this.pricingRepository,
            { isActive: true },
            {
              ...options,
              order: options.order || { price: 'ASC' },
            },
          );
        },
        this.cacheService.CACHE_TTL.VERY_LONG
      );
    } catch (error) {
      throw new HttpException(
        'Failed to fetch pricing plans',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Pricing> {
    try {
      const pricing = await this.pricingRepository.findOne({
        where: { id, isActive: true },
        relations: ['subscriptions'],
      });

      if (!pricing) throw new CustomHttpException(SYS_MSG.PRICING_NOT_FOUND, HttpStatus.NOT_FOUND);

      return pricing;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch pricing plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updatePricingDto: UpdatePricingDto): Promise<Pricing> {
    try {
      const pricing = await this.findOne(id);

      // efficient subscription check using count
      if (updatePricingDto.price) {
        const activeSubscriptionCount = await this.pricingRepository
          .createQueryBuilder('pricing')
          .leftJoin('pricing.subscriptions', 'subscription')
          .where('pricing.id = :id', { id })
          .andWhere('subscription.isActive = :isActive', { isActive: true })
          .getCount();

        if (activeSubscriptionCount > 0) {
          throw new CustomHttpException(SYS_MSG.CANNOT_UPDATE_ACTIVE_PLAN, HttpStatus.BAD_REQUEST);
        }
      }
      Object.assign(pricing, updatePricingDto);
      const updated = await this.pricingRepository.save(pricing);

      await this.cacheService.deleteByPrefix(this.cachePrefixes.PRICING_LIST);
      await this.cacheService.delete(this.cachePrefixes.PRICING, id);
      return updated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update pricing plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      const pricing = await this.findOne(id);

      const activeSubscriptionCount = await this.pricingRepository
        .createQueryBuilder('pricing')
        .leftJoin('pricing.subscriptions', 'subscription')
        .where('pricing.id = :id', { id })
        .andWhere('subscription.isActive = :isActive', { isActive: true })
        .getCount();

      if (activeSubscriptionCount > 0) {
        throw new CustomHttpException(SYS_MSG.CANNOT_DELETE_ACTIVE_PLAN, HttpStatus.BAD_REQUEST);
      }

      pricing.isActive = false;
      const removed = await this.pricingRepository.save(pricing);

      await this.cacheService.deleteByPrefix(this.cachePrefixes.PRICING_LIST);
      await this.cacheService.delete(this.cachePrefixes.PRICING, id);
      return removed;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete pricing plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByRegion(region: Region, options: PaginationOptions<Pricing> = {}) {
    try {
      const cacheKey = `region_${region}_${JSON.stringify(options)}`;
      return await this.cacheService.getOrSet(
        this.cachePrefixes.PRICING_LIST,
        cacheKey,
        async () => {
          return await this.paginationService.paginate(
            this.pricingRepository,
            { region, isActive: true },
            {
              ...options,
              order: options.order || { price: 'ASC' },
            },
          );
        },
        this.cacheService.CACHE_TTL.VERY_LONG
      );
    } catch (error) {
      throw new HttpException(
        'Failed to fetch pricing plans for region',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByAccessType(accessType: AccessType, options: PaginationOptions<Pricing> = {}) {
    try {
      const cacheKey = `access_type_${accessType}_${JSON.stringify(options)}`;
      return await this.cacheService.getOrSet(
        this.cachePrefixes.PRICING_LIST,
        cacheKey,
        async () => {
          return await this.paginationService.paginate(
            this.pricingRepository,
            { access_type: accessType, isActive: true },
            {
              ...options,
              order: options.order || { price: 'ASC' },
            },
          );
        },
        this.cacheService.CACHE_TTL.VERY_LONG
      );
    } catch (error) {
      throw new HttpException(
        'Failed to fetch pricing plans for access type',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPricingStats() {
    try {
      const stats = await this.pricingRepository
        .createQueryBuilder('pricing')
        .select([
          'pricing.region as region',
          'pricing.access_type as accessType',
          'COUNT(*) as count',
          'AVG(pricing.price) as averagePrice',
          'MIN(pricing.price) as minPrice',
          'MAX(pricing.price) as maxPrice'
        ])
        .where('pricing.isActive = :isActive', { isActive: true })
        .groupBy('pricing.region, pricing.access_type')
        .getRawMany();

      return stats;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch pricing statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

