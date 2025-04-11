import { Module } from '@nestjs/common';
import { ClientsService } from './client.service';
import { ClientsController } from './client.controller';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientModule {}
