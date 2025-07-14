import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '../../shared/cache/cache.service';
import { CachePrefixesService } from '../../shared/cache/cache.prefixes.service';
import { BaseCacheableService } from '../../shared/services/base-cacheable.service';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { PaginationService } from '../../shared/services/pagination.service';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import * as SYS_MSG from '../../shared/constants/SystemMessages';

@Injectable()
export class CustomerService extends BaseCacheableService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly permissionsService: EntityPermissionsService,
    private readonly paginationService: PaginationService,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService,
  ) { super(cacheService, cachePrefixes); }

  async create(createCustomerDto: CreateCustomerDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const existing = await this.customerRepository.findOne({
      where: [
        { email: createCustomerDto.email },
        { phone: createCustomerDto.phone }
      ]
    });
    if (existing) throw new BadRequestException(SYS_MSG.DUPLICATE_CUSTOMER);

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      user,
    });
    await this.customerRepository.save(customer);
    await this.invalidateOnCreate(userId, this.cachePrefixes.CUSTOMER);
    return { message: 'Customer created successfully' };
  }

  async findAll(paginationOptions: PaginationOptions<Customer>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const cacheKey = this.generatePaginationCacheKey(userId, paginationOptions);

    const paginated = await this.cacheResult(
      this.cachePrefixes.CUSTOMER_LIST,
      cacheKey,
      async () => this.paginationService.paginate(
        this.customerRepository,
        { user: { id: user.id } },
        paginationOptions
      ),
      this.cacheService.CACHE_TTL.MEDIUM
    );
    return {
      ...paginated,

    };
  }

  async findOne(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const customer = await this.cacheResult(
      this.cachePrefixes.CUSTOMER_BY_ID,
      id,
      async () => this.permissionsService.getEntityWithPermissionCheck(Customer, id, user, ['user']),
      this.cacheService.CACHE_TTL.LONG
    );
    if (customer && customer.user) {
      delete customer.user;
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const customer = await this.permissionsService.getEntityWithPermissionCheck(Customer, id, user, ['user']);
    Object.assign(customer, updateCustomerDto);
    await this.customerRepository.save(customer);
    await this.invalidateOnUpdate(id, userId, this.cachePrefixes.CUSTOMER);
    return { message: 'Customer information updated successfully' };
  }

  async remove(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const customer = await this.permissionsService.getEntityWithPermissionCheck(Customer, id, user, ['user']);
    await this.customerRepository.remove(customer);
    await this.invalidateOnDelete(id, userId, this.cachePrefixes.CUSTOMER);
    return { message: 'Customer deleted successfully' };
  }
}
