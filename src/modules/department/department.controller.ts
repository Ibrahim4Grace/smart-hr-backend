import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../auth/interfaces/auth.interface';
import { GetUser } from '../../shared/decorators/user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { Department } from './entities/department.entity';

@ApiTags('department')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({ status: 201, description: 'The department has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.departmentService.create(createDepartmentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'The departments have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Department>,
    @GetUser('userId') userId: string,) {
    return this.departmentService.findAll(paginationOptions, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID under an HR' })
  @ApiResponse({ status: 200, description: 'Department retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.departmentService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department by ID' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.departmentService.update(id, updateDepartmentDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a department by ID' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.departmentService.remove(id, userId);
  }
}
