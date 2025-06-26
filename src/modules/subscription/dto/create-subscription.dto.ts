import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus, PaymentStatus } from '../interface/subscription.interface';

export class InitializeSubscriptionDto {
    @ApiProperty({ description: 'ID of the pricing plan selected' })
    @IsString()
    pricingId: string;
}

export class SubscribeToPlanRequestDto {
    @ApiProperty({ description: 'ID of the pricing plan' })
    @IsString()
    plan_id: string;

    @ApiProperty({ description: 'Name of the pricing plan' })
    @IsString()
    plan_name: string;

    @ApiProperty({ description: 'Price of the plan' })
    @IsNumber()
    price: number;

    @ApiProperty({ description: 'Currency code (NGN, USD)' })
    @IsString()
    currency: string;

    @ApiProperty({ description: 'Duration (monthly, yearly)' })
    @IsString()
    duration: string;
}

export class SubscriptionResponseDto {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    subscription: any;

    @ApiProperty({ required: false })
    isTrial?: boolean;

    @ApiProperty({ required: false })
    trialEndsAt?: Date;

    @ApiProperty({ required: false })
    paymentUrl?: string;
}

export class SubscriptionStatusResponseDto {
    @ApiProperty()
    hasActiveSubscription: boolean;

    @ApiProperty({ required: false })
    subscription?: SubscriptionResponseDto;

    @ApiProperty({ required: false })
    daysUntilExpiry?: number;

    @ApiProperty({ required: false })
    isExpiringSoon?: boolean;

    @ApiProperty({ required: false })
    isTrial?: boolean;

    @ApiProperty({ required: false })
    trialExpired?: boolean;

    @ApiProperty({ required: false })
    requiresUpgrade?: boolean;
}

export class PaymentInitiationResponseDto {
    @ApiProperty()
    subscription: SubscriptionResponseDto;

    @ApiProperty({ required: false })
    paymentUrl?: string;

    @ApiProperty()
    message: string;

    @ApiProperty({ required: false })
    trialEndsAt?: Date;
}

export class PostLoginSubscriptionResponseDto {
    @ApiProperty({
        enum: ['ACTIVE', 'PENDING_PAYMENT', 'TRIAL_ACTIVATED', 'TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'CANCELLED', 'PAYMENT_FAILED', 'NO_SUBSCRIPTION', 'UNKNOWN'],
        description: 'Current subscription status'
    })
    status: string;

    @ApiProperty({ required: false })
    subscription?: any;

    @ApiProperty()
    message: string;

    @ApiProperty()
    canAccessDashboard: boolean;

    @ApiProperty({
        enum: ['ACCESS_DASHBOARD', 'PAYMENT', 'CHOOSE_PLAN', 'UPGRADE_TRIAL', 'RENEW_SUBSCRIPTION', 'RETRY_PAYMENT', 'CONTACT_SUPPORT'],
        description: 'Action required for the user'
    })
    action: string;

    @ApiProperty({ required: false })
    paymentUrl?: string;

    @ApiProperty({ required: false, format: 'date-time' })
    trialEndsAt?: Date;

    @ApiProperty({ required: false })
    isTrial?: boolean;

    @ApiProperty({ required: false })
    daysUntilExpiry?: number;
} 