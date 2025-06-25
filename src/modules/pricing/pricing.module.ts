import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { Pricing } from '../pricing/entities/pricing.entity';
import { User } from '../user/entities/user.entity';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pricing, User]),
    SharedModule
  ],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule { }
