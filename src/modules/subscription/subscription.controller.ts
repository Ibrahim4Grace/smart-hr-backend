import { Controller, Post, Get, Body, Param, UseGuards, Query, Headers } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { skipAuth } from '@shared/helpers/skipAuth';
import { GetUser } from '@shared/decorators/user.decorator';
import { SubscriptionResponse } from './interface/subscription.interface';
import {
  InitializeSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionStatusResponseDto,
  PaymentInitiationResponseDto,
  SubscribeToPlanRequestDto,
  PostLoginSubscriptionResponseDto
} from './dto/create-subscription.dto';


@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.HR)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }


  @Get('post-login-status')
  @ApiOperation({ description: 'Checks subscription status and provides action for user after login' })
  @ApiResponse({
    status: 200, description: 'Post-login subscription status retrieved.',
    type: PostLoginSubscriptionResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handlePostLoginSubscription(@GetUser('userId') userId: string) {
    return await this.subscriptionService.checkUserSubscriptionAfterLogin(userId);
  }


  @Post('subscribe')
  @ApiOperation({ description: 'Initialize subscription for selected plan and return payment URL' })
  @ApiResponse({
    status: 200, description: 'Subscription initiated successfully.',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async subscribeToPlan(
    @Body() body: SubscribeToPlanRequestDto,
    @GetUser('userId') userId: string
  ): Promise<SubscriptionResponse> {
    return await this.subscriptionService.subscribeToPlan(userId, body);
  }


  // Called after user registration to store their selected plan
  @Post('initialize')
  @ApiOperation({ description: 'Creates a pending subscription record for the user with their selected pricing plan' })
  @ApiResponse({
    status: 201, description: 'Subscription initialized successfully.',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async initializeSubscription(
    @Body() body: InitializeSubscriptionDto,
    @GetUser('userId') userId: string,
  ) {
    return await this.subscriptionService.storePendingSubscription(userId, body.pricingId);
  }

  // Called after user completes OTP verification to activate subscription
  @Post('activate')
  @ApiOperation({ description: 'Activates the subscription based on plan type (free trial or paid plan)' })
  @ApiResponse({
    status: 200, description: 'Subscription activated successfully.',
    type: PaymentInitiationResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No pending subscription found' })
  async activateSubscription(@GetUser('userId') userId: string,) {
    return await this.subscriptionService.activateSubscription(userId);
  }

  // Check current subscription status
  @Get('status')
  @ApiOperation({ description: 'Returns current subscription status and expiry information' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status retrieved.',
    type: SubscriptionStatusResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscriptionStatus(@GetUser('userId') userId: string,) {
    return await this.subscriptionService.checkSubscriptionStatus(userId);
  }

  // Handle trial expiration check
  @Get('trial-status')
  @ApiOperation({ description: 'Checks if trial has expired and provides upgrade options' })
  @ApiResponse({
    status: 200, description: 'Trial status retrieved.',
    type: SubscriptionStatusResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrialStatus(@GetUser('userId') userId: string,) {
    return await this.subscriptionService.handleTrialExpiration(userId);
  }

  // Upgrade from expired trial
  @Post('upgrade-trial')
  @ApiOperation({ summary: 'Upgrade user from expired trial to active subscription' })
  @ApiResponse({
    status: 200, description: 'Trial upgraded successfully.',
    type: PaymentInitiationResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No expired trial found' })
  async upgradeFromTrial(@GetUser('userId') userId: string) {
    return await this.subscriptionService.upgradeFromTrial(userId);
  }

  // Get user's active subscription details
  @Get('active')
  @ApiOperation({ description: 'Returns detailed information about the user active subscription' })
  @ApiResponse({
    status: 200, description: 'Active subscription retrieved.',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getActiveSubscription(@GetUser('userId') userId: string) {
    const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }
    return subscription;
  }

  @Post('webhook')
  @skipAuth()
  @ApiOperation({ description: 'Processes webhook events from Paystack for payment and subscription updates' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-paystack-signature') signature: string
  ) {
    return await this.subscriptionService.handleWebhook(body, signature);
  }

  // Cancel subscription
  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel a user subscription by ID', })
  @ApiResponse({
    status: 200, description: 'Subscription cancelled successfully.',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async cancelSubscription(@Param('id') subscriptionId: string) {
    return await this.subscriptionService.cancelSubscription(subscriptionId);
  }


  // // Handle payment callback from Paystack
  // @Get('callback')
  // @skipAuth()
  // @ApiOperation({
  //   summary: 'Handle payment callback from Paystack',
  //   description: 'Verifies payment and activates subscription when payment is successful'
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Payment callback handled and subscription activated.',
  //   type: SubscriptionResponseDto
  // })
  // @ApiResponse({ status: 400, description: 'Invalid or expired reference.' })
  // async handlePaymentCallback(@Query('reference') reference: string) {
  //   return await this.subscriptionService.verifyAndActivateSubscription(reference);
  // }

  // Verify payment status
  @Post('verify-payment/:reference')
  @ApiOperation({ description: 'Manually verify a payment reference and activate subscription if successful' })
  @ApiResponse({
    status: 200, description: 'Payment verified and subscription activated.',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Payment verification failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async verifyPayment(
    @Param('reference') reference: string,
    @GetUser('userId') userId: string
  ) {
    return await this.subscriptionService.verifyAndActivateSubscription(reference);
  }


}
