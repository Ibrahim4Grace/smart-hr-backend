import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../shared/decorators/user.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { UserRole } from '../../modules/auth/interfaces/auth.interface';
import { Roles } from '../../shared/decorators/roles.decorator';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { Customer } from './entities/customer.entity';

@ApiTags('Customer')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'The customer has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @GetUser('userId') userId: string,
  ) {
    return this.customerService.create(createCustomerDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'The customers have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Customer>,
    @GetUser('userId') userId: string,) {
    return this.customerService.findAll(paginationOptions, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'The customer has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,) {
    return this.customerService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, description: 'The customer has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser('userId') userId: string,) {
    return this.customerService.update(id, updateCustomerDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'The customer has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string,
    @GetUser('userId') userId: string,) {
    return this.customerService.remove(id, userId);
  }
}
