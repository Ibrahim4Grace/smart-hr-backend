import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResignationService } from './resignation.service';
import { CreateResignationDto } from './dto/create-resignation.dto';
import { UpdateResignationDto } from './dto/update-resignation.dto';

@Controller('resignation')
export class ResignationController {
  constructor(private readonly resignationService: ResignationService) {}

  @Post()
  create(@Body() createResignationDto: CreateResignationDto) {
    return this.resignationService.create(createResignationDto);
  }

  @Get()
  findAll() {
    return this.resignationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resignationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResignationDto: UpdateResignationDto) {
    return this.resignationService.update(+id, updateResignationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resignationService.remove(+id);
  }
}
