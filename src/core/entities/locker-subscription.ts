// src/core/entities/locker-subscription.ts
// Domain types aligned with the Locker Subscription REST API contract

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface LockerSubscriptionPlan {
    id: string;
    planName: string;
    planCode: string;
    lockerCapacity: number;
    maxConcurrentReservations: number;
    monthlyPrice: number;
    annualPrice: number;
    sharingEnabled: boolean;
    maxSharedUsers: number;
    description?: string;
}

export type SharingType = 'BASIC' | 'OWNER';
export type AccessLevel = 'BASIC_ACCESS' | 'FULL_ACCESS';
export type SharingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export interface LockerLocationRef {
    id: string;
    code: string;
    name: string;
    address: string;
}

export interface UsageByUser {
    userId: number;
    userName: string;
    activeReservations: number;
    allocatedBalance: number | null;
    sharingType: SharingType;
}

export interface SubscriptionUsageSnapshot {
    activeReservations: number;
    availableCapacity: number;
    totalCapacity: number;
    usageByUser: UsageByUser[];
}

export interface InvitationDetails {
    invitationToken: string | null;
    invitedAt: string;
    expiresAt: string | null;
    invitedByUserName: string;
}

export interface SharedSubscriptionUser {
    id: string;
    sharedWithUserId: number;
    sharedWithUserName: string;
    sharingType: SharingType;
    allocatedBalance: number | null;
    currentUsage: number;
    sharingStatus: SharingStatus;
    accessLevel: AccessLevel;
    invitationDetails: InvitationDetails;
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELED' | 'SUSPENDED';

export interface LockerSubscription {
    id: string;
    ownerUserId: number;
    subscriptionPlan: LockerSubscriptionPlan;
    location: LockerLocationRef;
    subscriptionStatus: SubscriptionStatus;
    billingCycle: BillingCycle;
    startDate: string;
    endDate: string;
    currentUsage: SubscriptionUsageSnapshot;
    sharedUsers: SharedSubscriptionUser[];
}

export interface AccessibleSubscription extends LockerSubscription {}

export interface ShareSubscriptionRequest {
    userEmail: string;
    sharingType: SharingType;
    allocatedBalance?: number | null;
    accessLevel: AccessLevel;
    invitationMessage?: string;
}

export interface UpdateSharingRequest {
    allocatedBalance?: number | null;
    accessLevel?: AccessLevel;
    sharingStatus?: SharingStatus;
}

export interface CreateSubscriptionRequest {
    planId: string;
    locationId: string;
    billingCycle: BillingCycle;
    paymentMethodId: string;
}

export interface UpgradeSubscriptionRequest {
    newPlanId: string;
    upgradeReason?: string;
}

export interface CancelSubscriptionResponse {
    success: boolean;
    data: string | null;
    message: string;
    errors: string[];
    timestamp: string;
}

export interface SubscriptionUsageResponse {
    success: boolean;
    data: SubscriptionUsageSnapshot;
    message: string;
    errors: string[];
    timestamp: string;
}
