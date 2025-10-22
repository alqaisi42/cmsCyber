// src/core/entities/lockers.ts
// Types describing locker locations, availability, and reservations

export type LockerSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

export interface LockerDimensions {
    width: number;
    height: number;
    depth: number;
    unit: string;
}

export type LockerStatus =
    | 'AVAILABLE'
    | 'OCCUPIED'
    | 'RESERVED'
    | 'MAINTENANCE'
    | 'OUT_OF_SERVICE'
    | 'INACTIVE';

export interface LockerFeature {
    id: string;
    label: string;
}

export interface LockerLocation {
    id: string;
    code: string;
    name: string;
    address: string;
    city: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    operatingHours?: Record<string, string>;
    features?: string[];
    availableLockerSizes?: LockerSize[];
    totalLockers: number;
    availableLockers: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt?: string;
}

export interface LockerLocationStats {
    id: string;
    code: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isActive: boolean;
    totalLockers: number;
    availableLockers: number;
    occupiedLockers: number;
    maintenanceLockers: number;
    outOfServiceLockers: number;
    utilizationRate?: number;
    subscriptions?: Array<{
        id: string;
        ownerUserId: number;
        ownerName: string;
        subscriptionType: string;
        subscriptionStatus: string;
        lockerCount: number;
        availableLockerCount: number;
    }>;
}

export interface LockerLocationTreeNode {
    id: string;
    code: string;
    name: string;
    type: 'LOCATION' | 'SUBSCRIPTION' | 'LOCKER';
    lockerCount: number;
    availableLockerCount: number;
    children: LockerLocationTreeNode[];
}

export interface LockerSummary {
    id: string;
    code: string;
    lockerNumber: string;
    subscriptionId?: string;
    locationId: string;
    locationName?: string;
    size: LockerSize;
    status: LockerStatus;
    dimensions?: LockerDimensions;
    features?: string[];
    currentReservation?: LockerReservation | null;
    nextAvailableFrom?: string | null;
    isActive?: boolean;
    maxCapacity?: number;
    availableCapacity?: number;
    isCurrentlyAvailable?: boolean;
    availableTimeSlots?: Array<{
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }>;
}

export interface LockerAvailabilityRequest {
    userId?: number | null;
    locationId: string;
    requiredSize: LockerSize;
    requestedFrom: string;
    requestedUntil: string;
    reservationType?: string;
    userScope?: 'SPECIFIC_USER' | 'ALL_USERS';
}

export interface LockerAvailabilityResult {
    isAvailable: boolean;
    locationId: string;
    locationName: string;
    requestedSize: LockerSize;
    requestedFrom: string;
    requestedUntil: string;
    availableLockers: Array<{
        lockerId: string;
        lockerNumber: string;
        size: LockerSize;
        subscriptionId?: string;
    }>;
    alternativeTimeSlots?: Array<{
        startTime: string;
        endTime: string;
        availableLockers: number;
    }>;
    reason?: string | null;
}

export interface LockerReservationRequest {
    userId?: number | null;
    lockerId: string;
    locationId: string;
    reservedFrom: string;
    reservedUntil: string;
    reservationType: string;
    orderId?: string;
    notes?: string;
    userScope?: 'SPECIFIC_USER' | 'ALL_USERS';
}

export interface LockerIssueSummary {
    id: string;
    lockerId: string;
    lockerCode: string;
    issueType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    title: string;
    description: string;
    reportedBy: string;
    reportedAt: string;
    assignedTo?: string | null;
    estimatedResolutionTime?: string | null;
    attachments?: string[];
    commentsCount?: number;
}

export interface LockerMaintenanceSummary {
    id: string;
    lockerId: string;
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    scheduledDate: string;
    estimatedDurationHours?: number;
    assignedTo?: string;
    notes?: string;
    completedAt?: string;
    totalCost?: number;
}

export interface LockerLocationWithLockers {
    location: LockerLocation;
    lockers: LockerSummary[];
    totalLockers: number;
    availableLockers: number;
    maintenanceCount?: number;
    issueCount?: number;
}

export interface LockerReservation {
    id: string;
    userId: number;
    userName?: string;
    lockerId: string;
    lockerNumber: string;
    lockerSize: LockerSize;
    locationId: string;
    locationName: string;
    locationAddress?: string;
    status: 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    reservationType: string;
    orderId?: string;
    reservedFrom: string;
    reservedUntil: string;
    accessCode?: string;
    accessCodeExpiresAt?: string;
    qrCode?: string;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface LockerReservationActionResponse {
    success: boolean;
    message: string;
    reservationId?: string;
    lockerId?: string;
    lockerNumber?: string;
    previousEndTime?: string;
    newEndTime?: string;
    extensionDuration?: number;
    additionalCharge?: number;
}

export interface LockerAccessValidationResult {
    success: boolean;
    data: boolean;
    message: string;
    errors?: string[];
    timestamp?: string;
}

export interface FamilyCalendarReservation {
    reservationId: string;
    lockerId: string;
    lockerNumber: string;
    userId: number;
    userName: string;
    reservationType: string;
    orderId?: string;
}

export interface FamilyCalendarTimeSlot {
    startTime: string;
    endTime: string;
    status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
    reservations: FamilyCalendarReservation[];
}

export interface FamilyCalendarResponse {
    subscriptionId: string;
    timeSlots: FamilyCalendarTimeSlot[];
    familyMembers: Array<{
        userId: number;
        userName: string;
        email: string;
        role: string;
        activeReservations: number;
        upcomingReservations: number;
    }>;
    conflicts?: Array<{
        conflictType: string;
        message: string;
        affectedReservations: string[];
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        suggestedAction?: string;
    }>;
}
