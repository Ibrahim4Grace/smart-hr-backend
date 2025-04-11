import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TerminationService } from './termination.service';
import { CreateTerminationDto } from './dto/create-termination.dto';
import { UpdateTerminationDto } from './dto/update-termination.dto';

@Controller('termination')
export class TerminationController {
  constructor(private readonly terminationService: TerminationService) {}

  @Post()
  create(@Body() createTerminationDto: CreateTerminationDto) {
    return this.terminationService.create(createTerminationDto);
  }

  @Get()
  findAll() {
    return this.terminationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.terminationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTerminationDto: UpdateTerminationDto) {
    return this.terminationService.update(+id, updateTerminationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.terminationService.remove(+id);
  }
}
