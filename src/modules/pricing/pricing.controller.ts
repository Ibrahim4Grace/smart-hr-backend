import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Pricing } from './entities/pricing.entity';
import { AccessType, Region } from './interface/price.interface';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { skipAuth } from '@shared/helpers/skipAuth';

@ApiTags('pricing')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new pricing plan' })
  @ApiResponse({ status: 201, description: 'Pricing plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createPricingDto: CreatePricingDto) {
    return this.pricingService.create(createPricingDto);
  }

  @Get()
  @skipAuth()
  @ApiOperation({ summary: 'Get all pricing plans' })
  @ApiResponse({ status: 200, description: 'Return all pricing plans' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'order', required: false, type: String })
  findAll(@Query() query: PaginationOptions<Pricing>) {
    return this.pricingService.findAll(query);
  }

  @Get('region/:region')
  @skipAuth()
  @ApiOperation({ summary: 'Get pricing plans by region' })
  @ApiResponse({ status: 200, description: 'Return pricing plans for the specified region' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'order', required: false, type: String })
  findByRegion(
    @Param('region') region: Region,
    @Query() query: PaginationOptions<Pricing>,
  ) {
    return this.pricingService.findByRegion(region, query);
  }

  @Get('access-type/:accessType')
  @ApiOperation({ summary: 'Get pricing plans by access type' })
  @ApiResponse({ status: 200, description: 'Return pricing plans for the specified access type' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'order', required: false, type: String })
  findByAccessType(
    @Param('accessType') accessType: AccessType,
    @Query() query: PaginationOptions<Pricing>,
  ) {
    return this.pricingService.findByAccessType(accessType, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pricing plan by id' })
  @ApiResponse({ status: 200, description: 'Return the pricing plan' })
  @ApiResponse({ status: 404, description: 'Pricing plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pricing plan' })
  @ApiResponse({ status: 200, description: 'Pricing plan updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Pricing plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(@Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto) {
    return this.pricingService.update(id, updatePricingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pricing plan' })
  @ApiResponse({ status: 200, description: 'Pricing plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Pricing plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.pricingService.remove(id);
  }
}
