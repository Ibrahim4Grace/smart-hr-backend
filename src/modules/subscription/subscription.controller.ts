import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { skipAuth } from '@shared/helpers/skipAuth';
import { GetUser } from '@shared/decorators/user.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  //Called after user registration to store their selected plan
  @Post('initialize')
  @ApiOperation({ summary: 'Initialize subscription after user registration' })
  @ApiResponse({ status: 201, description: 'Subscription initialized successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async initializeSubscription(
    @Body() body: { pricingId: string },
    @GetUser('userId') userId: string,
  ) {
    return await this.subscriptionService.storePendingSubscription(userId, body.pricingId);
  }

  // Called after user completes OTP verification to activate subscription
  @Post('activate')
  @ApiOperation({ summary: 'Activate subscription after OTP verification' })
  @ApiResponse({ status: 200, description: 'Subscription activated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async activateSubscription(@GetUser('userId') userId: string,) {
    return await this.subscriptionService.activateSubscription(userId);
  }

  // Handle payment callback from Paystack
  @Get('callback')
  @ApiOperation({ summary: 'Handle payment callback from Paystack' })
  @ApiResponse({ status: 200, description: 'Payment callback handled and subscription activated.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reference.' })
  async handlePaymentCallback(@Query('reference') reference: string) {
    return await this.subscriptionService.verifyAndActivateSubscription(reference);
  }

  // Check current subscription status
  @Get('status')
  @ApiOperation({ summary: 'Check user subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscriptionStatus(@GetUser('userId') userId: string,) {
    return await this.subscriptionService.checkSubscriptionStatus(userId);
  }

  // Handle trial expiration check
  @Get('trial-status')
  @ApiOperation({ summary: 'Check and handle trial subscription expiration' })
  @ApiResponse({ status: 200, description: 'Trial status retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrialStatus(@GetUser('userId') userId: string,) {
    return await this.subscriptionService.handleTrialExpiration(userId);
  }

  // Upgrade from expired trial
  @Post('upgrade-trial')
  @ApiOperation({ summary: 'Upgrade user from expired trial to active subscription' })
  @ApiResponse({ status: 200, description: 'Trial upgraded successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upgradeFromTrial(@GetUser('userId') userId: string) {
    return await this.subscriptionService.upgradeFromTrial(userId);
  }

  // Cancel subscription
  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel a user subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async cancelSubscription(@Param('id') subscriptionId: string) {
    return await this.subscriptionService.cancelSubscription(subscriptionId);
  }
}
