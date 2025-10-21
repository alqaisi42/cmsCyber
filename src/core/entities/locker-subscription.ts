// src/core/entities/locker-subscription.ts
// Domain types representing locker subscription plans and user subscriptions

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface SubscriptionPlanFeatures {
    maxLockers: number;
    lockerSizes: string[];
    maxReservationsPerMonth: number;
    allowSharing: boolean;
    maxSharedUsers: number;
    prioritySupport: boolean;
    advancedBooking: number;
}

export interface LockerSubscriptionPlan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: SubscriptionPlanFeatures;
    isActive: boolean;
}

export type SubscriptionStatus = 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';

export interface AssignedLockerSummary {
    lockerId: string;
    lockerNumber: string;
    size: string;
    isAvailable?: boolean;
}

export interface SubscriptionFeaturesSummary {
    maxLockers: number;
    allowSharing: boolean;
    maxSharedUsers: number;
    currentSharedUsers?: number;
}

export interface SubscriptionUsageStatistics {
    reservationsThisMonth: number;
    maxReservationsPerMonth: number;
    utilizationRate: number;
}

export interface LockerUsageSummary {
    assignedLockers: number;
    maxLockers: number;
    activeReservations: number;
    mostUsedLocker?: {
        lockerId: string;
        lockerNumber: string;
        usageCount: number;
    };
}

export interface SharingUsageSummary {
    activeSharedUsers: number;
    maxSharedUsers: number;
    totalSharedReservations: number;
    sharedUsersBreakdown?: Array<{
        userId: number;
        userName: string;
        reservationsCount: number;
        lastAccessDate: string;
    }>;
}

export interface FinancialSummary {
    monthlyCharge: number;
    nextBillingDate: string;
    totalPaidToDate: number;
    discountsApplied: number;
}

export interface SubscriptionUsageResponse {
    subscriptionId: string;
    userId: number;
    planName: string;
    billingCycle: BillingCycle;
    currentPeriod: {
        startDate: string;
        endDate: string;
    };
    reservationUsage: SubscriptionUsageStatistics;
    lockerUsage: LockerUsageSummary;
    sharingUsage: SharingUsageSummary;
    financialSummary: FinancialSummary;
}

export interface LockerSubscription {
    id: string;
    userId: number;
    planId: string;
    planName: string;
    locationId: string;
    locationName: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    monthlyPrice: number;
    isAutoRenew: boolean;
    assignedLockers: AssignedLockerSummary[];
    features: SubscriptionFeaturesSummary;
    usageStatistics?: SubscriptionUsageStatistics;
    createdAt: string;
    updatedAt?: string;
}

export type SubscriptionAccessType = 'OWNER' | 'SHARED';

export interface AccessibleSubscription {
    id: string;
    userId: number;
    ownerName?: string;
    planName: string;
    locationName: string;
    status: SubscriptionStatus;
    accessType: SubscriptionAccessType;
    permissions: string[];
    sharedBy?: string;
    sharedDate?: string;
    assignedLockers: AssignedLockerSummary[];
}

export interface ShareSubscriptionRequest {
    sharedWithUserId?: number;
    sharedWithEmail?: string;
    permissions: string[];
    accessStartDate?: string;
    accessEndDate?: string;
    notes?: string;
}

export interface UpdateSharingRequest {
    permissions?: string[];
    accessEndDate?: string;
    notes?: string;
}

export interface CreateSubscriptionRequest {
    planId: string;
    locationId: string;
    billingCycle: BillingCycle;
    autoRenew: boolean;
    paymentMethodId?: string;
}

export interface UpgradeSubscriptionRequest {
    newPlanId: string;
    effectiveImmediately?: boolean;
}

export interface CancelSubscriptionResponse {
    success: boolean;
    data: string | null;
    message: string;
    errors: string[];
    timestamp: string;
}
