import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { UserPayload } from './interface/user.interface';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '@guards/admin.guard';
import { GetUser } from '../../decorators/get-user.decorator';
import { UpdateUserDto, DeactivateAccountDto, ReactivateAccountDto } from './dto/create-user.dto';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';

@Controller('users')
export class UserController {
  private logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @UseGuards(AdminGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Request() req: { user: UserPayload }, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.userService.findAll(page, limit, req.user);
  }

  @Get(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User Data by ID' })
  @ApiResponse({ status: 200, description: 'User data fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findOne(@Request() req, @Param('userId') userId: string) {
    return this.userService.findOne(userId);
  }

  @UseGuards(AdminGuard)
  @Patch('deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'The account has been successfully deactivated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async deactivateAccount(@GetUser() admin: UserPayload, @Body() deactivateAccountDto: DeactivateAccountDto) {
    return this.userService.deactivateUser(admin.name, deactivateAccountDto);
  }

  @UseGuards(AdminGuard)
  @Patch('/reactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate a user account  (Admin only)' })
  @ApiResponse({ status: 200, description: 'The account has been successfully reactivated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async reactivateAccount(@GetUser() admin: UserPayload, @Body() reactivateAccountDto: ReactivateAccountDto) {
    return this.userService.reactivateUser(admin.name, reactivateAccountDto);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update User' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UpdateUserDto,
  })
  update(@Request() req: { user: UserPayload }, @Param('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(userId, updateUserDto, req.user);
  }

  @UseGuards(AdminGuard)
  @Delete(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a user account' })
  @ApiResponse({ status: 204, description: 'Deletion in progress' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  remove(@Param('userId') userId: string, @Request() req: { user: UserPayload }) {
    return this.userService.remove(userId, req.user);
  }
}
