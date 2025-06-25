import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PaystackService } from './gateway/paystack.service';
import { Subscription } from './entities/subscription.entity';
import { Pricing } from '../pricing/entities/pricing.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Pricing, User]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PaystackService],
  exports: [SubscriptionService],
})
export class SubscriptionModule { }
