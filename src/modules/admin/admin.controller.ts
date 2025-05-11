import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { GetUser } from '@shared/decorators/user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('hr/:hrId/deactivate')
    @ApiOperation({ summary: 'Deactivate an HR account and their employees' })
    @ApiResponse({ status: 200, description: 'HR account and employees deactivated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'HR account not found' })
    async deactivateHrAccount(
        @Param('hrId') hrId: string,
        @Body('reason') reason: string,
        @GetUser('userId') adminId: string,
    ) {
        await this.adminService.deactivateHrAccount(hrId, reason, adminId);
        return { message: 'HR account and associated employees deactivated successfully' };
    }

    @Post('hr/:hrId/reactivate')
    @ApiOperation({ summary: 'Reactivate an HR account and their employees' })
    @ApiResponse({ status: 200, description: 'HR account and employees reactivated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'HR account not found' })
    async reactivateHrAccount(
        @Param('hrId') hrId: string,
        @Body('reason') reason: string,
        @GetUser('userId') adminId: string,
    ) {
        await this.adminService.reactivateHrAccount(hrId, reason, adminId);
        return { message: 'HR account and associated employees reactivated successfully' };
    }

    @Get('hr')
    @ApiOperation({ summary: 'Get all HR accounts' })
    @ApiResponse({ status: 200, description: 'List of HR accounts retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getHrAccounts() {
        const hrAccounts = await this.adminService.getHrAccounts();
        return { data: hrAccounts };
    }

    @Get('hr/:hrId')
    @ApiOperation({ summary: 'Get HR account details' })
    @ApiResponse({ status: 200, description: 'HR account details retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'HR account not found' })
    async getHrAccountDetails(@Param('hrId') hrId: string) {
        const hrAccount = await this.adminService.getHrAccountDetails(hrId);
        return { data: hrAccount };
    }
} 