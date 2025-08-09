import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CachePrefixesService } from '../../shared/cache/cache.prefixes.service';
import { BaseCacheableService } from '../../shared/services/base-cacheable.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationService } from '../../shared/services/pagination.service';
import { User } from '../../modules/user/entities/user.entity';
import { Employee } from '../../modules/employee/entities/employee.entity';
import { Client } from '../../modules/client/entities/client.entity';
import { SequentialIdService } from '../../shared/services/sequential-id.service';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { ImageService } from '../../shared/services/image-upload.service';



@Injectable()
export class ProjectService extends BaseCacheableService {

  private readonly relations = [
    'client', 'added_by_hr',
    'team_members', 'team_leaders'
  ];

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly paginationService: PaginationService,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService,
    private readonly sequentialIdService: SequentialIdService,
    private permissionsService: EntityPermissionsService,
    private readonly imageService: ImageService,
  ) {
    super(cacheService, cachePrefixes);
  }

  // Private helper methods
  private async validateRelationships(dto: Partial<CreateProjectDto>, user: User): Promise<void> {
    const validations = [];

    if (dto.client_id) {
      validations.push(
        this.permissionsService.getEntityWithPermissionCheck(
          Client,
          dto.client_id,
          user,
          ['added_by_hr']
        ).catch(() => {
          throw new NotFoundException('Client not found or access denied');
        })
      );
    }




    await Promise.all(validations);
  }

  private async assignTeamMembers(project: Project, dto: Partial<CreateProjectDto>, user: User): Promise<void> {
    const assignments = [];

    if (dto.team_member_ids !== undefined) {
      if (dto.team_member_ids.length > 0) {
        assignments.push(
          Promise.all(
            dto.team_member_ids.map(id =>
              this.permissionsService.getEntityWithPermissionCheck(
                Employee,
                id,
                user,
                ['added_by_hr']
              )
            )
          ).then(teamMembers => {
            project.team_members = teamMembers;
          }).catch(() => {
            throw new NotFoundException('Some team members not found or access denied');
          })
        );
      } else {
        project.team_members = [];
      }
    }

    if (dto.team_leader_ids !== undefined) {
      if (dto.team_leader_ids.length > 0) {
        assignments.push(
          Promise.all(
            dto.team_leader_ids.map(id =>
              this.permissionsService.getEntityWithPermissionCheck(
                Employee,
                id,
                user,
                ['added_by_hr']
              )
            )
          ).then(teamLeaders => {
            project.team_leaders = teamLeaders;
          }).catch(() => {
            throw new NotFoundException('Some team leaders not found or access denied');
          })
        );
      } else {
        project.team_leaders = [];
      }
    }

    await Promise.all(assignments);
  }

  private transformProjectResponse(project: any): any {
    return {
      ...project,
      added_by_hr: project.added_by_hr ? {
        id: project.added_by_hr.id,
        name: project.added_by_hr.name,
        hr_profile_pic_url: project.added_by_hr.hr_profile_pic_url
      } : null,
      client: project.client ? {
        id: project.client.id,
        client_id: project.client.client_id,
        client_name: project.client.client_name,
        client_email: project.client.client_email,
        client_company_name: project.client.client_company_name,
        client_image_url: project.client.client_image_url
      } : null,
      team_members: project.team_members?.map(member => ({
        id: member.id,
        employee_id: member.employee_id,
        first_name: member.first_name,
        last_name: member.last_name,
        employee_profile_pic_url: member.employee_profile_pic_url
      })) || [],
      team_leaders: project.team_leaders?.map(leader => ({
        id: leader.id,
        employee_id: leader.employee_id,
        first_name: leader.first_name,
        last_name: leader.last_name,
        employee_profile_pic_url: leader.employee_profile_pic_url
      })) || [],
    };
  }

  async create(createProjectDto: CreateProjectDto, userId: string, file?: Express.Multer.File) {
    const user = await this.permissionsService.getUserById(userId);
    const projectId = await this.sequentialIdService.generateProjectId(this.projectRepository);

    await this.validateRelationships(createProjectDto, user);

    // Handle image upload synchronously if file exists
    let imageUrl: string | null = null;
    if (file) {
      try {
        imageUrl = await this.imageService.handleImageUpload(file, {
          entityType: 'project',
          operation: 'create',
          fieldName: 'project_image_url',
        });
      } catch (error) {
        this.logger.warn(`Image upload failed during project creation: ${error.message}`);
      }
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      project_id: projectId,
      start_date: new Date(createProjectDto.start_date),
      added_by_hr: user,
      end_date: createProjectDto.end_date ? new Date(createProjectDto.end_date) : null,
      project_image_url: imageUrl,
    });

    await this.assignTeamMembers(project, createProjectDto, user);
    await this.projectRepository.save(project);
    await this.invalidateOnCreate(userId, this.cachePrefixes.PROJECT);

    return {
      statusCode: 201,
      message: 'Project created successfully',
    };

  }

  async findAll(paginationOptions: PaginationOptions<Project>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const cacheKey = this.generatePaginationCacheKey(userId, paginationOptions);

    const paginated = await this.cacheResult(
      this.cachePrefixes.PROJECT_LIST,
      cacheKey,
      async () => this.paginationService.paginate(
        this.projectRepository,
        { added_by_hr: { id: userId } },
        {
          ...paginationOptions,
          relations: this.relations
        }
      ),
      this.cacheService.CACHE_TTL.MEDIUM
    );

    return {
      ...paginated,
      data: paginated.data.map(project => this.transformProjectResponse(project))
    };
  }


  async findOne(projectId: string, userId: string): Promise<Project> {
    const user = await this.permissionsService.getUserById(userId);

    return this.cacheResult(
      this.cachePrefixes.PROJECT_BY_ID,
      projectId,
      async () => {
        const project = await this.permissionsService.getEntityWithPermissionCheck(
          Project,
          projectId,
          user,
          ['added_by_hr', 'client', 'team_members', 'team_leaders']
        );

        return this.transformProjectResponse(project);
      },
      this.cacheService.CACHE_TTL.LONG
    );
  }

  async update(
    projectId: string, updateProjectDto: UpdateProjectDto,
    userId: string, file?: Express.Multer.File
  ) {
    const user = await this.permissionsService.getUserById(userId);

    const project = await this.permissionsService.getEntityWithPermissionCheck(
      Project,
      projectId,
      user,
      ['added_by_hr', 'client', 'team_members', 'team_leaders']
    );

    await this.validateRelationships(updateProjectDto, user);

    // Update basic fields
    Object.assign(project, {
      ...updateProjectDto,
      start_date: updateProjectDto.start_date ? new Date(updateProjectDto.start_date) : project.start_date,
      end_date: updateProjectDto.end_date ? new Date(updateProjectDto.end_date) : project.end_date,
    });

    await this.assignTeamMembers(project, updateProjectDto, user);
    await this.projectRepository.save(project);


    // Handle image update asynchronously if provided
    //old image  Will be deleted after successful upload
    if (file) {
      await this.imageService.queueImageUpload(file, projectId, {
        entityType: 'project',
        operation: 'update',
        entityId: projectId,
        fieldName: 'project_image_url',
        oldImageUrl: project.project_image_url,
        priority: 1,
      });
    }
    await this.invalidateOnUpdate(projectId, userId, this.cachePrefixes.PROJECT_BY_ID);

    return {
      statusCode: 200,
      message: 'Project updated successfully.',

    };

  }

  async remove(projectId: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const project = await this.permissionsService.getEntityWithPermissionCheck(
      Project,
      projectId,
      user,
      ['added_by_hr']
    );
    await this.projectRepository.remove(project);

    if (project.project_image_url) {
      await this.imageService.queueImageDeletion(
        project.project_image_url,
        'project',
        projectId
      ).catch(error => {
        this.logger.warn(`Failed to queue image deletion: ${error.message}`);
      });
    }

    await this.invalidateOnUpdate(projectId, userId, this.cachePrefixes.PROJECT_BY_ID);

    return {
      statusCode: 200,
      message: 'Project deleted successfully',
    };
  }


}
