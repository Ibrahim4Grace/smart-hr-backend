import { Controller, Get, Body, Post, Patch, Param, Delete, Query, UseGuards, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from '@shared/decorators/user.decorator';
import { UpdateUserDto } from './dto/create-user.dto';
import { UploadUserProfilePicDto } from './dto/upload-profile-pic.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidator } from '@shared/helpers/file.validator';
import { MAX_PROFILE_PICTURE_SIZE, VALID_UPLOADS_MIME_TYPES } from '@shared/constants/SystemMessages';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { Employee } from '@modules/employee/entities/employee.entity';
import { User } from './entities/user.entity';
import {
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { CreateEmployeeDto } from '@modules/employee/dto/create-employee.dto';
import { ChangePasswordDto } from '@modules/employee/dto/change-password.dto';


@ApiTags('hr')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('hr')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('employee')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'The employee has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser('userId') userId: string,
  ) {
    return this.userService.createEmployee(createEmployeeDto, userId);
  }


  @Get('employees')
  @ApiOperation({ summary: 'Get all employees under an HR' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'HR not found' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findEmployeesByHR(
    @Query() paginationOptions: PaginationOptions<Employee>,
    @GetUser('userId') hrId: string) {
    return this.userService.findEmployeesByHR(hrId, paginationOptions);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get HR information' })
  @ApiResponse({ status: 200, description: 'HR information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'HR not found' })
  getHRInfo(
    @GetUser('userId') hrId: string) {
    return this.userService.getHRInfo(hrId);
  }


  @Patch('profile')
  @Roles(UserRole.HR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update own HR profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateOwnProfile(
    @GetUser('userId') userId: string,
    @Body() updatedUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updatedUserDto, userId);
  }

  @Post('change-password')
  @ApiBody({ type: ChangePasswordDto })
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetUser('userId') userId: string,
  ) {
    return this.userService.changePassword(userId, changePasswordDto);
  }

  @Get('/employees/:employeeId')
  @ApiOperation({ summary: 'Get employee by ID under an HR' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findEmployeeById(
    @Param('employeeId') employeeId: string,
    @GetUser('userId') hrId: string
  ) {
    return this.userService.findEmployeeById(employeeId, hrId);
  }


  @Delete(':employeeId')
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiResponse({ status: 204, description: 'Deletion in progress' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  remove(
    @Param('employeeId') employeeId: string,
    @GetUser('userId') userId: string
  ) {
    return this.userService.remove(employeeId, userId);
  }



  @Post(':employeeId/deactivate')
  @ApiOperation({ summary: 'Deactivate an employee account (HR can only deactivate their own employees)' })
  @ApiResponse({ status: 200, description: 'The employee has been successfully deactivated.' })
  @ApiResponse({ status: 400, description: 'Bad Request or Employee already deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to deactivate this employee' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async deactivateEmployee(
    @GetUser('userId') hrId: string,
    @Param('employeeId') employeeId: string,) {
    return this.userService.deactivateEmployee(hrId, employeeId);
  }

  @Post(':employeeId/reactivate')
  @ApiOperation({ summary: 'Reactivate an employee account (HR can only reactivate their own employees)' })
  @ApiResponse({ status: 200, description: 'The employee has been successfully reactivated.' })
  @ApiResponse({ status: 400, description: 'Bad Request or Employee already active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to reactivate this employee' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async reactivateEmployee(
    @GetUser('userId') hrId: string,
    @Param('employeeId') employeeId: string,) {
    return this.userService.reactivateEmployee(hrId, employeeId);
  }



  @Post('upload-image')
  @ApiOperation({ summary: 'Upload Hr Profile Picture' })
  @ApiResponse({ description: 'Profile picture uploaded successfully' })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadUserProfilePicDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  async uploadProfilePicture(
    @GetUser('userId') userId: string,
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
    const uploadProfilePicDto = new UploadUserProfilePicDto();
    uploadProfilePicDto.avatar = file;
    return await this.userService.uploadProfilePicture(userId, uploadProfilePicDto);
  }



}
