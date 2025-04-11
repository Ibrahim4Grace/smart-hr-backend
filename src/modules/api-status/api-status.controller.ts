import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiStatusService } from './api-status.service';
import { CreateApiStatusDto } from './dto/create-api-status.dto';
import { UpdateApiStatusDto } from './dto/update-api-status.dto';

@Controller('api-status')
export class ApiStatusController {
  constructor(private readonly apiStatusService: ApiStatusService) {}

  @Post()
  create(@Body() createApiStatusDto: CreateApiStatusDto) {
    return this.apiStatusService.create(createApiStatusDto);
  }

  @Get()
  findAll() {
    return this.apiStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiStatusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApiStatusDto: UpdateApiStatusDto) {
    return this.apiStatusService.update(+id, updateApiStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiStatusService.remove(+id);
  }
}
