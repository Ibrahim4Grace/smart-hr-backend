import { Module } from '@nestjs/common';
import { TermConditionService } from './term-condition.service';
import { TermConditionController } from './term-condition.controller';

@Module({
  controllers: [TermConditionController],
  providers: [TermConditionService],
})
export class TermConditionModule {}
