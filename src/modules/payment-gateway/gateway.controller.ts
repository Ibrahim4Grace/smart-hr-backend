import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { CreateGatewayDto } from './dto/create-gateway.dto';
import { UpdateGatewayDto } from './dto/update-gateway.dto';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post()
  create(@Body() createGatewayDto: CreateGatewayDto) {
    return this.gatewayService.create(createGatewayDto);
  }

  @Get()
  findAll() {
    return this.gatewayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gatewayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGatewayDto: UpdateGatewayDto) {
    return this.gatewayService.update(+id, updateGatewayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gatewayService.remove(+id);
  }
}
