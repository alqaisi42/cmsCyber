// src/core/entities/locker-operations.ts
// Domain types for advanced locker operations management views.

import {
    LockerDetails,
    LockerIssue,
    LockerMaintenanceRecord,
    LockerReservation,
    LockerSummary,
} from './lockers';

export interface LockerLocationDigest {
    id: string;
    code?: string;
    name: string;
    address?: string | null;
    totalLockers: number;
    availableLockers: number;
    maintenanceLockers: number;
}

export interface LockerSubscriptionDigest {
    id: string;
    name?: string;
    ownerName?: string;
    lockerCount?: number;
    activeReservations?: number;
    status?: string;
}

export interface LockerLocationOverview {
    location: {
        id: string;
        name: string;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    } | null;
    statistics: {
        totalLockers: number;
        availableLockers: number;
        occupiedLockers: number;
        maintenanceLockers: number;
    };
    lockers: LockerDetails[];
    reservations: LockerReservation[];
    subscriptions: LockerSubscriptionDigest[];
}

export interface LockerIssuesMaintenanceOverview {
    locker: LockerSummary | null;
    issues: LockerIssue[];
    maintenanceRecords: LockerMaintenanceRecord[];
}

export interface LockerListResult {
    lockers: LockerSummary[];
    totalElements: number;
    page: number;
    size: number;
    locations: LockerLocationDigest[];
}

export interface CreateLockerPayload {
    code: string;
    name: string;
    locationId: string;
    subscriptionId: string;
    lockerNumber: number;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
    maxCapacity: number;
    description?: string;
}

export interface BulkCreateLockerPayload {
    locationId: string;
    subscriptionId: string;
    startNumber: number;
    count: number;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
    maxCapacity: number;
}

export interface UpdateLockerStatusPayload {
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE';
    reason?: string;
    estimatedDowntimeHours?: number;
}

export interface CreateIssuePayload {
    lockerId: string;
    issueType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    reportedBy: string;
    attachments?: string[];
}

export interface UpdateIssuePayload {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    assignedTo?: string | null;
    updateNotes?: string | null;
}

export interface ScheduleMaintenancePayload {
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
    scheduledDate: string;
    estimatedDurationHours: number;
    assignedTo: string;
    tasks?: string[];
    notes?: string;
}

export interface UpdateMaintenancePayload {
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    completedAt?: string;
    actualDurationHours?: number;
    findings?: string;
    partsUsed?: string[];
    laborHours?: number;
    totalCost?: number;
}
