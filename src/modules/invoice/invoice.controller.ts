import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UserRole } from '../auth/interfaces/auth.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { GetUser } from '../../shared/decorators/user.decorator';
import { Invoice } from './entities/invoice.entity';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { InvoiceFilterDto } from './dto/invoice-filter.dto';

@ApiTags('Invoice')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({ status: 201, description: 'The invoice has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @GetUser('userId') userId: string,
  ) {
    return this.invoiceService.create(createInvoiceDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'The invoices have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Invoice>,
    @GetUser('userId') userId: string,) {
    return this.invoiceService.findAll(paginationOptions, userId);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Get all invoices with filtering' })
  @ApiResponse({ status: 200, description: 'The invoices have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllWithFiltering(
    @Query() filterOptions: InvoiceFilterDto,
    @GetUser('userId') userId: string,
  ) {
    return this.invoiceService.findAllWithFilters(filterOptions, userId);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,) {
    return this.invoiceService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiBody({ type: UpdateInvoiceDto })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @GetUser('userId') userId: string,) {
    return this.invoiceService.update(id, updateInvoiceDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 200, description: 'The invoice has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string,) {
    return this.invoiceService.remove(id, userId);
  }
}
