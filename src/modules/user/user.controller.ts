import { Controller, Get, Body, Post, Patch, Param, Delete, Query, Request, UseGuards } from '@nestjs/common';
import { UserPayload } from './interface/user.interface';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from '@shared/decorators/user.decorator';
import { UpdateUserDto, DeactivateAccountDto, ReactivateAccountDto } from './dto/create-user.dto';
import { UploadUserProfilePicDto } from './dto/upload-profile-pic.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidator } from '@shared/helpers/file.validator';
import { MAX_PROFILE_PICTURE_SIZE, VALID_UPLOADS_MIME_TYPES } from '@shared/constants/SystemMessages';
import {
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';


@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @GetUser('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10) {
    return this.userService.findAll(page, limit, userId);
  }

  @Patch('deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'The account has been successfully deactivated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async deactivateAccount(
    @GetUser('userId') adminId: string,
    @Body() deactivateAccountDto: DeactivateAccountDto) {
    return this.userService.deactivateUser(adminId, deactivateAccountDto);
  }

  @Patch('/reactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate a user account  (Admin only)' })
  @ApiResponse({ status: 200, description: 'The account has been successfully reactivated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async reactivateAccount(
    @GetUser('userId') adminId: string,
    @Body() reactivateAccountDto: ReactivateAccountDto) {
    return this.userService.reactivateUser(adminId, reactivateAccountDto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get User Data by ID' })
  @ApiResponse({ status: 200, description: 'User data fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findOne(
    @Param('userId') userId: string) {
    return this.userService.findOne(userId);
  }


  @Patch(':userId')
  @ApiOperation({ summary: 'Update User' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UpdateUserDto,
  })
  async updateUser(
    @Request() req: { user: UserPayload },
    @Param('userId') userId: string,
    @Body() updatedUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updatedUserDto, req.user);
  }

  @Delete(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a user account' })
  @ApiResponse({ status: 204, description: 'Deletion in progress' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  remove(
    @Param('userId') userId: string,
  ) {
    return this.userService.remove(userId);
  }


  @ApiOperation({ summary: 'Upload Profile Picture' })
  @ApiResponse({
    status: 201,
    description: 'Profile picture uploaded successfully',
  })
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadUserProfilePicDto,
    description: 'Profile picture file',
  })
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
