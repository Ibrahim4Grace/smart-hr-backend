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