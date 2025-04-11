import { Module } from '@nestjs/common';
import { ApiStatusService } from './api-status.service';
import { ApiStatusController } from './api-status.controller';

@Module({
  controllers: [ApiStatusController],
  providers: [ApiStatusService],
})
export class ApiStatusModule {}
