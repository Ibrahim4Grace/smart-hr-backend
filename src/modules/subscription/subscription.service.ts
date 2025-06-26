import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { GatewayService } from './gateway.service';
import { Pricing } from '../pricing/entities/pricing.entity';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { SubscriptionStatus, PaymentStatus, SubscribeToPlanRequest, SubscriptionResponse, PostLoginSubscriptionResponse } from './interface/subscription.interface';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription) private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Pricing) private pricingRepository: Repository<Pricing>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private paystackService: GatewayService,
    private configService: ConfigService,

  ) { }




  private async initiatePaidSubscription(subscription: Subscription) {
    const pricing = subscription.pricing;
    const user = subscription.user;

    // Initialize Paystack transaction
    const transaction = await this.paystackService.initializeTransaction({
      amount: pricing.price,
      email: user.email,
      currency: subscription.currency,
      callback_url: `${this.configService.get<string>('FRONTEND_URL')}/subscription/callback`,
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

  private async activateFreeTrial(subscription: Subscription) {
    const endDate = new Date(subscription.start_date);

    // Set trial duration
    if (subscription.pricing.duration === '2 days') {
      endDate.setDate(endDate.getDate() + 2);
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

  // Helper method to calculate days until expiry
  private calculateDaysUntilExpiry(endDate: Date): number {
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }


  // Handle successful payment
  private async handlePaymentSuccess(data: any) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { paystack_reference: data.reference },
      relations: ['user', 'pricing']
    });

    if (subscription) {
      // Update subscription status
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.payment_status = PaymentStatus.SUCCESSFUL;
      subscription.paystack_customer_code = data.customer?.customer_code;

      // Calculate end date
      const endDate = new Date(subscription.start_date);
      this.calculateEndDate(endDate, subscription.pricing.duration);
      subscription.end_date = endDate;

      await this.subscriptionRepository.save(subscription);

      this.logger.log(`Subscription activated: ${subscription.id}`);
    }
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

  async checkUserSubscriptionAfterLogin(userId: string): Promise<PostLoginSubscriptionResponse> {
    // Get user's current subscription most recent subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
      },
      relations: ['pricing'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      return {
        status: 'NO_SUBSCRIPTION',
        message: 'Please choose a subscription plan to continue',
        canAccessDashboard: false,
        action: 'CHOOSE_PLAN',
      };
    }

    // Check subscription status
    switch (subscription.status) {
      case SubscriptionStatus.ACTIVE:
        return {
          status: 'ACTIVE',
          subscription,
          message: 'Welcome back! Your subscription is active.',
          canAccessDashboard: true,
          action: 'ACCESS_DASHBOARD',
          isTrial: subscription.is_trial,
          daysUntilExpiry: this.calculateDaysUntilExpiry(subscription.end_date),
        };

      case SubscriptionStatus.PENDING:
        // Check if it's a free trial or paid plan
        if (subscription.pricing.price === 0 || subscription.pricing.duration === '2 days') {
          // Activate free trial
          const activatedSubscription = await this.activateFreeTrial(subscription);
          return {
            status: 'TRIAL_ACTIVATED',
            subscription: activatedSubscription.subscription,
            message: 'Free trial activated! Welcome to your dashboard.',
            canAccessDashboard: true,
            action: 'ACCESS_DASHBOARD',
            isTrial: true,
            trialEndsAt: activatedSubscription.trialEndsAt,
          };
        } else {
          const paymentResult = await this.initiatePaidSubscription(subscription);
          return {
            status: 'PENDING_PAYMENT',
            subscription,
            message: 'Please complete your payment to activate your subscription.',
            canAccessDashboard: false,
            action: 'PAYMENT',
            paymentUrl: paymentResult.paymentUrl,
          };
        }

      case SubscriptionStatus.EXPIRED:
        if (subscription.is_trial) {
          return {
            status: 'TRIAL_EXPIRED',
            subscription,
            message: 'Your free trial has expired. Please upgrade to continue.',
            canAccessDashboard: false,
            action: 'UPGRADE_TRIAL',
          };
        } else {
          return {
            status: 'SUBSCRIPTION_EXPIRED',
            subscription,
            message: 'Your subscription has expired. Please renew to continue.',
            canAccessDashboard: false,
            action: 'RENEW_SUBSCRIPTION',
          };
        }

      case SubscriptionStatus.CANCELLED:
        return {
          status: 'CANCELLED',
          subscription,
          message: 'Your subscription has been cancelled. Please choose a new plan.',
          canAccessDashboard: false,
          action: 'CHOOSE_PLAN',
        };

      case SubscriptionStatus.FAILED:
        return {
          status: 'PAYMENT_FAILED',
          subscription,
          message: 'Payment failed. Please try again or choose a different plan.',
          canAccessDashboard: false,
          action: 'RETRY_PAYMENT',
        };

      default:
        return {
          status: 'UNKNOWN',
          subscription,
          message: 'Subscription status unknown. Please contact support.',
          canAccessDashboard: false,
          action: 'CONTACT_SUPPORT',
        };
    }
  }

  async subscribeToPlan(userId: string, planData: SubscribeToPlanRequest): Promise<SubscriptionResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

      // Check if user already has an active subscription
      const existingSubscription = await this.getUserActiveSubscription(userId);
      if (existingSubscription) {
        return {
          success: true,
          message: 'You already have an active subscription',
          subscription: existingSubscription,
          isTrial: existingSubscription.is_trial,
        };
      }

      // Handle free trial plan
      if (planData.plan_id === 'free-trial' || planData.price === 0) {
        const freeTrialPricing = await this.pricingRepository.findOne({
          where: { duration: '2 days', isActive: true }
        });

        if (!freeTrialPricing) throw new HttpException('Free trial plan not available', HttpStatus.BAD_REQUEST);

        const subscription = this.subscriptionRepository.create({
          user,
          pricing: freeTrialPricing,
          start_date: new Date(),
          status: SubscriptionStatus.ACTIVE,
          payment_status: PaymentStatus.NOT_REQUIRED,
          amount_paid: 0,
          currency: planData.currency,
          is_trial: true,
        });

        // Set trial end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 2);
        subscription.end_date = endDate;

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        return {
          success: true,
          message: 'Free trial activated successfully!',
          subscription: savedSubscription,
          isTrial: true,
          trialEndsAt: endDate,
        };
      }

      // Handle paid plans
      const pricing = await this.pricingRepository.findOne({
        where: { id: planData.plan_id, isActive: true }
      });
      if (!pricing) throw new HttpException('Pricing plan not found', HttpStatus.NOT_FOUND);


      // Create pending subscription
      const subscription = this.subscriptionRepository.create({
        user,
        pricing,
        start_date: new Date(),
        status: SubscriptionStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        amount_paid: planData.price,
        currency: planData.currency,
        is_trial: false,
      });

      const savedSubscription = await this.subscriptionRepository.save(subscription);

      // Initialize payment
      const paymentResult = await this.initiatePaidSubscription(savedSubscription);

      return {
        success: true,
        message: 'Please complete your payment to activate your subscription',
        subscription: savedSubscription,
        paymentUrl: paymentResult.paymentUrl,
        isTrial: false,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to subscribe to plan',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


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

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.auto_renew = false;
    await this.subscriptionRepository.save(subscription);

    return subscription;
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



  // Simplified method: Handle post-login subscription flow
  async handlePostLoginSubscription(userId: string) {
    // First check if user has any subscription
    const subscriptionStatus = await this.checkSubscriptionStatus(userId);

    if (subscriptionStatus.hasActiveSubscription) {
      // User has active subscription, return dashboard access
      return {
        canAccessDashboard: true,
        subscription: subscriptionStatus.subscription,
        message: 'Welcome back! Your subscription is active.',
        actionRequired: false,
      };
    }

    // Check for pending subscription
    const pendingSubscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.PENDING
      },
      relations: ['pricing'],
    });

    if (pendingSubscription) {
      // User has pending subscription, activate it
      const activationResult = await this.activateSubscription(userId);

      // Check if it's a paid plan (has paymentUrl) or free trial
      if ('paymentUrl' in activationResult) {
        // Paid plan - redirect to payment
        return {
          canAccessDashboard: false,
          subscription: activationResult.subscription,
          paymentUrl: activationResult.paymentUrl,
          message: 'Please complete your payment to activate your subscription.',
          actionRequired: true,
          actionType: 'PAYMENT',
        };
      } else {
        // Free trial activated
        return {
          canAccessDashboard: true,
          subscription: activationResult.subscription,
          message: 'Free trial activated! Welcome to your dashboard.',
          actionRequired: false,
          trialEndsAt: activationResult.trialEndsAt,
        };
      }
    }

    // No subscription found - user needs to select a plan
    return {
      canAccessDashboard: false,
      subscription: null,
      message: 'Please select a subscription plan to continue.',
      actionRequired: true,
      actionType: 'SELECT_PLAN',
    };
  }


  // Handle Paystack webhook events
  async handleWebhook(body: any, signature: string) {
    try {
      // Verify webhook signature
      const payload = JSON.stringify(body);
      const isValidSignature = this.paystackService.verifyWebhookSignature(payload, signature);

      if (!isValidSignature) {
        throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
      }

      // Process webhook event
      const result = await this.paystackService.processWebhookEvent(body);

      // Handle subscription-specific events
      if (body.event === 'charge.success') {
        await this.handlePaymentSuccess(body.data);
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
        event: body.event,
        result
      };

    } catch (error) {
      this.logger.error('Webhook handling error:', error);
      throw new HttpException(
        'Failed to process webhook',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


} 