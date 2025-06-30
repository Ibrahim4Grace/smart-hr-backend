export enum BillingCycle {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY'
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    FAILED = 'FAILED'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESSFUL = 'SUCCESSFUL',
    FAILED = 'FAILED',
    NOT_REQUIRED = 'NOT_REQUIRED',
}


export interface SubscribeToPlanRequest {
    plan_id: string;
}


export interface SubscriptionResponse {
    success: boolean;
    message: string;
    subscription: any;
    isTrial?: boolean;
    trialEndsAt?: Date;
    paymentUrl?: string;
}

export interface PostLoginSubscriptionResponse {
    status: 'ACTIVE' | 'PENDING_PAYMENT' | 'TRIAL_ACTIVATED' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'NO_SUBSCRIPTION' | 'UNKNOWN';
    subscription?: any;
    message: string;
    canAccessDashboard: boolean;
    action: 'ACCESS_DASHBOARD' | 'PAYMENT' | 'CHOOSE_PLAN' | 'UPGRADE_TRIAL' | 'RENEW_SUBSCRIPTION' | 'RETRY_PAYMENT' | 'CONTACT_SUPPORT';
    paymentUrl?: string;
    trialEndsAt?: Date;
    isTrial?: boolean;
    daysUntilExpiry?: number;
}
