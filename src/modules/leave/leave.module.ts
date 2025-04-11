import { Module } from '@nestjs/common';
import { LeavesService } from './leave.service';
import { LeavesController } from './leave.controller';

@Module({
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
