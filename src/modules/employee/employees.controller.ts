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
@UseGuards(RolesGuard)
@Roles(UserRole.EMPLOYEE)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }


  @Post('upload-image')
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


  @Patch(':employeeId')
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

}
