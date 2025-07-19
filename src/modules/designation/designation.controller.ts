import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { GetUser } from '../../shared/decorators/user.decorator';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { Designation } from './entities/designation.entity';


@ApiTags('designation')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('designation')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ type: CreateDesignationDto })
  @ApiResponse({ status: 201, description: 'The department has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  create(
    @Body() createDesignationDto: CreateDesignationDto,
    @GetUser('userId') userId: string,
  ) {
    return this.designationService.create(createDesignationDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all designations' })
  @ApiResponse({ status: 200, description: 'The designations have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Designation>,
    @GetUser('userId') userId: string,
  ) {
    return this.designationService.findAll(paginationOptions, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a designation by id' })
  @ApiResponse({ status: 200, description: 'The designation has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(@Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.designationService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a designation by id' })
  @ApiBody({ type: UpdateDesignationDto })
  @ApiResponse({ status: 200, description: 'The designation has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  update(@Param('id') id: string,
    @Body() updateDesignationDto: UpdateDesignationDto,
    @GetUser('userId') userId: string,
  ) {
    return this.designationService.update(id, updateDesignationDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a designation by id' })
  @ApiResponse({ status: 200, description: 'The designation has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  remove(@Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.designationService.remove(id, userId);
  }
}
