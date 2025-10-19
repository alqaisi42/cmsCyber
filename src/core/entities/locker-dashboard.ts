// src/core/entities/locker-dashboard.ts

export interface LockerLocation {
    id: string;
    code: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

export interface LockerPlan {
    id: string;
    name: string;
    code: string;
    capacity: number;
    monthlyPrice: number;
    annualPrice: number;
}

export interface SharedUser {
    userId: number;
    name: string;
    sharingType: 'OWNER' | 'BASIC' | 'ADVANCED';
    accessLevel: 'FULL_OWNER' | 'MANAGE_SHARING' | 'BASIC_ACCESS';
    allocatedBalance: number | null;
    currentUsage: number;
}

export interface Subscription {
    id: string;
    location: LockerLocation;
    plan: LockerPlan;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED';
    billingCycle: 'MONTHLY' | 'ANNUALLY';
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    currentUsage: number;
    availableCapacity: number;
    sharedWith: SharedUser[];
}

export interface LockerInfo {
    id: string;
    code: string;
    name: string;
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
}

export interface Reservation {
    id: string;
    locker: LockerInfo;
    location: LockerLocation;
    orderId: string;
    reservedFrom: string;
    reservedUntil: string;
    reservationType: 'INCOMING_DELIVERY' | 'OUTGOING_SHIPMENT' | 'PERSONAL_USE';
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    accessCode: string;
    createdAt: string;
}

export interface AvailableLocation {
    location: LockerLocation;
    totalLockers: number;
    availableLockers: number;
    lockersBySize: {
        SMALL?: number;
        MEDIUM?: number;
        LARGE?: number;
    };
}

export interface FamilyMember {
    userId: number;
    name: string;
    email: string;
    subscriptionName: string;
    locationName: string;
    sharingType: 'OWNER' | 'BASIC' | 'ADVANCED';
    accessLevel: 'FULL_OWNER' | 'MANAGE_SHARING' | 'BASIC_ACCESS';
    allocatedBalance: number | null;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface Statistics {
    totalReservations: number;
    activeReservations: number;
    completedReservations: number;
    totalCapacity: number;
    usedCapacity: number;
    mostUsedLocation: string;
    mostUsedSize: string;
    totalFamilyMembers: number;
}

export interface UserLockerDashboard {
    user: {
        id: number;
        name: string;
        email: string;
        totalSubscriptions: number;
        totalSharedAccess: number;
    };
    ownedSubscriptions: Subscription[];
    sharedSubscriptions: Subscription[];
    activeReservations: Reservation[];
    pastReservations: Reservation[];
    availableLocations: AvailableLocation[];
    familyMembers: FamilyMember[];
    statistics: Statistics;
}

export interface LockerDashboardResponse {
    success: boolean;
    data: UserLockerDashboard;
    message: string;
    errors: string[];
    timestamp: string;
}