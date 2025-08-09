import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../shared/decorators/user.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { UserRole } from '../../modules/auth/interfaces/auth.interface';
import { Roles } from '../../shared/decorators/roles.decorator';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { Project } from './entities/project.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidator } from '../../shared/helpers/file.validator';
import { MAX_PROFILE_PICTURE_SIZE, VALID_UPLOADS_MIME_TYPES } from '../../shared/constants/SystemMessages';
import {
  Controller, Get, Post, Body, Patch, UseGuards, Param, Delete,
  Query, ValidationPipe, UseInterceptors, UsePipes,
  UploadedFile
} from '@nestjs/common';

@ApiTags('Project')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: 'The project has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('project_image_url'))
  create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser('userId') userId: string,
    @UploadedFile(
      new FileValidator({
        maxSize: MAX_PROFILE_PICTURE_SIZE,
        mimeTypes: VALID_UPLOADS_MIME_TYPES,
        required: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.projectService.create(createProjectDto, userId, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects ' })
  @ApiResponse({ status: 200, description: 'The projects has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findAll(
    @Query() paginationOptions: PaginationOptions<Project>,
    @GetUser('userId') userId: string,) {
    return this.projectService.findAll(paginationOptions, userId);
  }


  @Get(':projectId')
  @ApiOperation({ summary: 'Get an project by ID' })
  @ApiResponse({ status: 200, description: 'The project has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(
    @Param('projectId') projectId: string,
    @GetUser('userId') userId: string) {
    return this.projectService.findOne(projectId, userId);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update an project by ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'The project has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('project_image_url'))
  update(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser('userId') userId: string,
    @UploadedFile(
      new FileValidator({
        maxSize: MAX_PROFILE_PICTURE_SIZE,
        mimeTypes: VALID_UPLOADS_MIME_TYPES,
        required: false,
      }),
    )
    file: Express.Multer.File,) {
    return this.projectService.update(projectId, updateProjectDto, userId, file);
  }


  @Delete(':projectId')
  @ApiOperation({ summary: 'Delete an project by ID' })
  @ApiResponse({ status: 200, description: 'The project has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  remove(
    @Param('projectId') projectId: string,
    @GetUser('userId') userId: string,) {
    return this.projectService.remove(projectId, userId);
  }
}
