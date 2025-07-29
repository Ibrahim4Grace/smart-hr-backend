
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '../auth/interfaces/auth.interface';
import { GetUser } from '../../shared/decorators/user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { PaginationOptions } from '@shared/interfaces/pagination.interface';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset } from './entities/asset.entity';
import { AssetFilterDto } from './dto/filter-asset.dto';
import { MAX_PROFILE_PICTURE_SIZE, VALID_UPLOADS_MIME_TYPES } from '../../shared/constants/SystemMessages';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { FileValidator } from '../../shared/helpers/file.validator';
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
  Query, UsePipes, UploadedFile, ValidationPipe, UseInterceptors,
  UploadedFiles
} from '@nestjs/common';


@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('asset')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ type: CreateAssetDto })
  @ApiResponse({ status: 201, description: 'The department has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Body() createAssetDto: CreateAssetDto,
    @GetUser('userId') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.assetsService.create(createAssetDto, userId, files);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({ status: 200, description: 'The assets have been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiQuery({ type: AssetFilterDto })
  findAll(
    @Query() paginationOptions: PaginationOptions<Asset>,
    @GetUser('userId') userId: string,
    @Query() filters: AssetFilterDto,
  ) {
    return this.assetsService.findAllByFilters(paginationOptions, userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an asset by ID' })
  @ApiResponse({ status: 200, description: 'The asset has been successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.assetsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset by ID' })
  @ApiBody({ type: UpdateAssetDto })
  @ApiResponse({ status: 200, description: 'The asset has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('asset_image_url'))
  update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
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
    return this.assetsService.update(id, updateAssetDto, userId, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset by ID' })
  @ApiResponse({ status: 200, description: 'The asset has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.assetsService.remove(id, userId);
  }
}
