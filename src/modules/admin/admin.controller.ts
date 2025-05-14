import { UploadedFile, UsePipes, ValidationPipe, UseInterceptors, Delete, Patch } from '@nestjs/common';
import { Controller, Post, Param, Get, UseGuards, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { GetUser } from '@shared/decorators/user.decorator';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { User } from '@modules/user/entities/user.entity';
import { UploadUserProfilePicDto } from '@modules/user/dto/upload-profile-pic.dto';
import { MAX_PROFILE_PICTURE_SIZE, VALID_UPLOADS_MIME_TYPES } from '@shared/constants/SystemMessages';
import { FileValidator } from '@shared/helpers/file.validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from '@modules/user/dto/create-user.dto';


@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }


    @Get('hrs')
    @ApiOperation({ summary: 'Get all HR users' })
    @ApiResponse({ status: 200, description: 'HR users retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAllHR(
        @Query() paginationOptions: PaginationOptions<User>) {
        return this.adminService.findAllHR(paginationOptions);
    }


    @Get()
    @ApiOperation({ summary: 'Get all admin users' })
    @ApiResponse({ status: 200, description: 'Admin users retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAllAdmins(
        @Query() paginationOptions: PaginationOptions<User>) {
        return this.adminService.findAllAdmins(paginationOptions);
    }

    @Get()
    @ApiOperation({ summary: 'Get Admin information' })
    @ApiResponse({ status: 200, description: 'Admin information retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Admin not found' })
    getAdminInfo(
        @GetUser('userId') adminId: string) {
        return this.adminService.getAdminInfo(adminId);
    }


    @Get('hr/:hrId')
    @ApiOperation({ summary: 'Get HR user by ID' })
    @ApiResponse({ status: 200, description: 'HR user retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'HR user not found' })
    findHRById(
        @Param('id') id: string) {
        return this.adminService.findHRById(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get admin user by ID' })
    @ApiResponse({ status: 200, description: 'Admin user retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Admin user not found' })
    findAdminById(
        @Param('id') id: string) {
        return this.adminService.findAdminById(id);
    }

    @Delete(':targetHrId')
    @ApiOperation({ summary: 'Delete a hr account' })
    @ApiResponse({ status: 204, description: 'Deletion in progress' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    remove(
        @Param('targetHrId') targetHrId: string,
        @GetUser('userId') adminId: string,) {
        return this.adminService.remove(targetHrId, adminId);
    }

    @Patch(':userId')
    @ApiOperation({ summary: 'Update Admin' })
    @ApiResponse({
        status: 200,
        description: 'Admin updated successfully',
        type: UpdateUserDto,
    })
    async updateAdmin(
        @GetUser('userId') currentUserId: string,
        @Param('userId') userId: string,
        @Body() updatedUserDto: UpdateUserDto,
    ) {
        return this.adminService.update(userId, updatedUserDto, currentUserId);
    }

    @Patch(':hrId/deactivate')
    @ApiOperation({ summary: 'Deactivate an hr and its employees' })
    @ApiResponse({ status: 200, description: 'The hr and its employees have been successfully deactivated.' })
    @ApiResponse({ status: 400, description: 'Bad Request or Employee already deactivated' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to deactivate this hr' })
    @ApiResponse({ status: 404, description: 'Hr not found' })
    async deactivateEmployee(
        @GetUser('userId') adminId: string,
        @Param('hrId') hrId: string,) {
        return this.adminService.deactivateHrAccount(hrId, adminId);
    }

    @Patch(':hrId/reactivate')
    @ApiOperation({ summary: 'Reactivate an hr and its employees' })
    @ApiResponse({ status: 200, description: 'The hr and its employees have been successfully reactivated.' })
    @ApiResponse({ status: 400, description: 'Bad Request or Employee already active' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to reactivate this hr' })
    @ApiResponse({ status: 404, description: 'Hr not found' })
    async reactivateEmployee(
        @GetUser('userId') adminId: string,
        @Param('hrId') hrId: string,) {
        return this.adminService.reactivateHrAccount(hrId, adminId);
    }



    @Post('upload-image')
    @ApiOperation({ summary: 'Upload Admin Profile Picture' })
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
        return await this.adminService.uploadProfilePicture(userId, uploadProfilePicDto);
    }


    // @Post('hr/:hrId/deactivate')
    // @ApiOperation({ summary: 'Deactivate an HR account and their employees' })
    // @ApiResponse({ status: 200, description: 'HR account and employees deactivated successfully' })
    // @ApiResponse({ status: 403, description: 'Forbidden' })
    // @ApiResponse({ status: 404, description: 'HR account not found' })
    // async deactivateHrAccount(
    //     @Param('hrId') hrId: string,
    //     @Body('reason') reason: string,
    //     @GetUser('userId') adminId: string,
    // ) {
    //     await this.adminService.deactivateHrAccount(hrId, reason, adminId);
    //     return { message: 'HR account and associated employees deactivated successfully' };
    // }

    // @Post('hr/:hrId/reactivate')
    // @ApiOperation({ summary: 'Reactivate an HR account and their employees' })
    // @ApiResponse({ status: 200, description: 'HR account and employees reactivated successfully' })
    // @ApiResponse({ status: 403, description: 'Forbidden' })
    // @ApiResponse({ status: 404, description: 'HR account not found' })
    // async reactivateHrAccount(
    //     @Param('hrId') hrId: string,
    //     @Body('reason') reason: string,
    //     @GetUser('userId') adminId: string,
    // ) {
    //     await this.adminService.reactivateHrAccount(hrId, reason, adminId);
    //     return { message: 'HR account and associated employees reactivated successfully' };
    // }


    // @Get('hr/:hrId')
    // @ApiOperation({ summary: 'Get HR account details' })
    // @ApiResponse({ status: 200, description: 'HR account details retrieved successfully' })
    // @ApiResponse({ status: 403, description: 'Forbidden' })
    // @ApiResponse({ status: 404, description: 'HR account not found' })
    // async getHrAccountDetails(@Param('hrId') hrId: string) {
    //     const hrAccount = await this.adminService.getHrAccountDetails(hrId);
    //     return { data: hrAccount };
    // }
} 