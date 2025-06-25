import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus, PaymentStatus } from './interface/subscription.interface';
import { GatewayService } from '../payment-gateway/gateway.service';
import { Pricing } from '../pricing/entities/pricing.entity';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription) private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Pricing) private pricingRepository: Repository<Pricing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private paystackService: GatewayService,
    private configService: ConfigService,

  ) { }

  async storePendingSubscription(userId: string, pricingId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const pricing = await this.pricingRepository.findOne({ where: { id: pricingId } });

    if (!user || !pricing) {
      throw new HttpException('User or pricing plan not found', HttpStatus.NOT_FOUND);
    }

    // Create pending subscription record
    const subscription = this.subscriptionRepository.create({
      user,
      pricing,
      start_date: new Date(),
      status: SubscriptionStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      amount_paid: 0,
      currency: pricing.region === 'AFRICA' ? 'NGN' : 'USD',
    });

    return await this.subscriptionRepository.save(subscription);
  }

  // Activate subscription based on plan type
  async activateSubscription(userId: string) {
    const pendingSubscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.PENDING
      },
      relations: ['user', 'pricing'],
    });

    if (!pendingSubscription) {
      throw new HttpException('No pending subscription found', HttpStatus.NOT_FOUND);
    }

    const pricing = pendingSubscription.pricing;

    // Handle free trial
    if (pricing.price === 0 || pricing.duration === '2 days') {
      return await this.activateFreeTrial(pendingSubscription);
    }

    // Handle paid plans
    return await this.initiatePaidSubscription(pendingSubscription);
  }

  private async activateFreeTrial(subscription: Subscription) {
    const endDate = new Date(subscription.start_date);

    // Set trial duration
    if (subscription.pricing.duration === '2 days') {
      endDate.setDate(endDate.getDate() + 2);
    } else {
      // Default free trial duration
      endDate.setDate(endDate.getDate() + 7);
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.payment_status = PaymentStatus.NOT_REQUIRED;
    subscription.end_date = endDate;
    subscription.is_trial = true;

    await this.subscriptionRepository.save(subscription);

    return {
      subscription,
      message: 'Free trial activated successfully',
      trialEndsAt: endDate,
    };
  }

  private async initiatePaidSubscription(subscription: Subscription) {
    const pricing = subscription.pricing;
    const user = subscription.user;

    // Initialize Paystack transaction
    const transaction = await this.paystackService.initializeTransaction({
      amount: pricing.price,
      email: user.email,
      currency: subscription.currency,
      callback_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8000'}/subscription/callback`,
      metadata: {
        subscription_id: subscription.id,
        user_id: user.id,
      },
    });

    // Update subscription with payment reference
    subscription.paystack_reference = transaction.data.reference;
    subscription.amount_paid = pricing.price;
    await this.subscriptionRepository.save(subscription);

    return {
      subscription,
      paymentUrl: transaction.data.authorization_url,
      message: 'Proceed to payment to activate subscription',
    };
  }

  async verifyAndActivateSubscription(reference: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { paystack_reference: reference },
      relations: ['user', 'pricing'],
    });

    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    const verification = await this.paystackService.verifyTransaction(reference);

    if (verification.data.status === 'success') {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.payment_status = PaymentStatus.SUCCESSFUL;
      subscription.paystack_customer_code = verification.data.customer.customer_code;

      // Calculate end date based on duration
      const endDate = new Date(subscription.start_date);
      this.calculateEndDate(endDate, subscription.pricing.duration);
      subscription.end_date = endDate;

      await this.subscriptionRepository.save(subscription);
      return subscription;
    } else {
      subscription.status = SubscriptionStatus.FAILED;
      subscription.payment_status = PaymentStatus.FAILED;
      await this.subscriptionRepository.save(subscription);

      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  private calculateEndDate(startDate: Date, duration: string): Date {
    const endDate = new Date(startDate);

    switch (duration.toLowerCase()) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case '2 days':
        endDate.setDate(endDate.getDate() + 2);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
    }

    return endDate;
  }

  // Handle trial expiration and payment requirement
  async handleTrialExpiration(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.ACTIVE,
        is_trial: true,
      },
      relations: ['pricing', 'user'],
    });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const isExpired = subscription.end_date <= now;

    if (isExpired) {
      // Convert trial to paid subscription requirement
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);

      return {
        trialExpired: true,
        subscription,
        requiresPayment: true,
      };
    }

    const hoursUntilExpiry = Math.ceil(
      (subscription.end_date.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    return {
      trialExpired: false,
      subscription,
      hoursUntilExpiry,
      requiresPayment: hoursUntilExpiry <= 24, // Require payment in last 24 hours
    };
  }

  async upgradeFromTrial(userId: string) {
    const expiredTrial = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.EXPIRED,
        is_trial: true,
      },
      relations: ['pricing', 'user'],
    });

    if (!expiredTrial) {
      throw new HttpException('No expired trial found', HttpStatus.NOT_FOUND);
    }

    // Create new paid subscription
    const newSubscription = this.subscriptionRepository.create({
      user: expiredTrial.user,
      pricing: expiredTrial.pricing,
      start_date: new Date(),
      status: SubscriptionStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      amount_paid: expiredTrial.pricing.price,
      currency: expiredTrial.currency,
      is_trial: false,
    });

    const savedSubscription = await this.subscriptionRepository.save(newSubscription);
    return await this.initiatePaidSubscription(savedSubscription);
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    if (subscription.paystack_customer_code) {
      await this.paystackService.disableSubscription(subscription.paystack_customer_code);
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.auto_renew = false;
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  async getUserActiveSubscription(userId: string) {
    return this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['pricing'],
    });
  }

  async checkSubscriptionStatus(userId: string) {
    const subscription = await this.getUserActiveSubscription(userId);

    if (!subscription) {
      // Check for expired trial
      const trialStatus = await this.handleTrialExpiration(userId);
      if (trialStatus?.trialExpired) {
        return {
          hasActiveSubscription: false,
          subscription: null,
          trialExpired: true,
          requiresUpgrade: true,
        };
      }

      return {
        hasActiveSubscription: false,
        subscription: null,
      };
    }

    // Check if subscription is about to expire
    const daysUntilExpiry = Math.ceil(
      (subscription.end_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      hasActiveSubscription: true,
      subscription,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 7,
      isTrial: subscription.is_trial,
    };
  }
} 