import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TermConditionService } from './term-condition.service';
import { CreateTermConditionDto } from './dto/create-term-condition.dto';
import { UpdateTermConditionDto } from './dto/update-term-condition.dto';

@Controller('term-condition')
export class TermConditionController {
  constructor(private readonly termConditionService: TermConditionService) {}

  @Post()
  create(@Body() createTermConditionDto: CreateTermConditionDto) {
    return this.termConditionService.create(createTermConditionDto);
  }

  @Get()
  findAll() {
    return this.termConditionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.termConditionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTermConditionDto: UpdateTermConditionDto) {
    return this.termConditionService.update(+id, updateTermConditionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.termConditionService.remove(+id);
  }
}
