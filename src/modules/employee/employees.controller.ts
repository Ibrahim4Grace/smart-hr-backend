import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, HttpCode, UseGuards } from '@nestjs/common';
import { Query, UseInterceptors, UploadedFile, ValidationPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { GetUser } from '@shared/decorators/user.decorator';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { Employee } from './entities/employee.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadProfilePicDto } from './dto/upload-profile-pic.dto';
import { MAX_PROFILE_PICTURE_SIZE, VALID_UPLOADS_MIME_TYPES } from '@shared/constants/SystemMessages';
import { FileValidator } from '@shared/helpers/file.validator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { RolesGuard } from '@guards/roles.guard';


@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'The employee has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser('userId') userId: string,
  ) {
    return this.employeesService.create(createEmployeeDto, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all employees' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Returns all employees' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Employee>,
    @GetUser('userId') userId: string) {
    return this.employeesService.findAll(paginationOptions, userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @HttpCode(200)
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiResponse({ status: 200, description: 'Returns the employee' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,) {
    return this.employeesService.findOne(id, userId);
  }

  @Patch(':employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Update an employee by ID' })
  @ApiResponse({ status: 200, description: 'The employee has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  update(
    @Param('employeeId') employeeId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser('userId') userId: string,) {
    return this.employeesService.update(employeeId, updateEmployeeDto, userId);
  }

  @Delete(':employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete an employee by ID' })
  @ApiResponse({ status: 200, description: 'The employee has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  remove(
    @Param('id') employeeId: string,
    @GetUser('userId') userId: string,) {
    return this.employeesService.remove(employeeId, userId);
  }

  @Post('upload-image')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @HttpCode(201)
  @ApiOperation({ summary: 'Upload Employee Profile Picture' })
  @ApiResponse({
    status: 201,
    description: 'Employee profile picture uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadProfilePicDto,
    description: 'Profile picture file',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async uploadProfilePicture(
    @GetUser('userId') employeeId: string,
    @UploadedFile(
      new FileValidator({
        maxSize: MAX_PROFILE_PICTURE_SIZE,
        mimeTypes: VALID_UPLOADS_MIME_TYPES,
      }),
    )
    file: Express.Multer.File,
  ): Promise<{
    status: string;
    message: string;
    data: { avatar_url: string };
  }> {
    const uploadDto = new UploadProfilePicDto();
    uploadDto.avatar = file;
    return await this.employeesService.uploadProfilePicture(employeeId, uploadDto);
  }

  @Post('change-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Change employee password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetUser('userId') employeeId: string,
  ) {
    return this.employeesService.changePassword(employeeId, changePasswordDto);
  }
}
