import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HelpSupportService } from './help-support.service';
import { CreateHelpSupportDto } from './dto/create-help-support.dto';
import { UpdateHelpSupportDto } from './dto/update-help-support.dto';

@Controller('help-support')
export class HelpSupportController {
  constructor(private readonly helpSupportService: HelpSupportService) {}

  @Post()
  create(@Body() createHelpSupportDto: CreateHelpSupportDto) {
    return this.helpSupportService.create(createHelpSupportDto);
  }

  @Get()
  findAll() {
    return this.helpSupportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.helpSupportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHelpSupportDto: UpdateHelpSupportDto) {
    return this.helpSupportService.update(+id, updateHelpSupportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.helpSupportService.remove(+id);
  }
}
