import { Module } from '@nestjs/common';
import { ResignationService } from './resignation.service';
import { ResignationController } from './resignation.controller';

@Module({
  controllers: [ResignationController],
  providers: [ResignationService],
})
export class ResignationModule {}
