import { Module } from '@nestjs/common';
import { HelpSupportService } from './help-support.service';
import { HelpSupportController } from './help-support.controller';

@Module({
  controllers: [HelpSupportController],
  providers: [HelpSupportService],
})
export class HelpSupportModule {}
