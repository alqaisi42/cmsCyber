// src/infrastructure/repositories/locker-admin.repository.ts
// Admin Locker Repository - Clean Architecture Implementation

import { apiClient } from '../api/client';
import {
    LockerSummary,
    LockerIssue,
    LockerMaintenanceRecord,
    UpdateLockerIssuePayload,
    ResolveLockerIssuePayload,
    LockerStatus,
    LockerSize,
    LockerIssueStatus,
    LockerDetails,
    LockerActiveReservation,
} from '../../core/entities/lockers';
import {
    ApiResponse,
    PaginatedResponse,
    SpringBootPageResponse,
    transformSpringPageToPaginated
} from '../../core/interfaces/repositories';

// ==========================================
// REQUEST/FILTER TYPES
// ==========================================

export interface LockerListFilters {
    locationId?: string;
    subscriptionId?: string;
    status?: LockerStatus;
    size?: LockerSize;
    isActive?: boolean;
    maintenanceStatus?: 'OPERATIONAL' | 'REQUIRES_MAINTENANCE' | 'UNDER_MAINTENANCE';
    page?: number;
    pageSize?: number;
    sort?: string;
}

export interface CreateLockerRequest {
    code: string;
    name: string;
    locationId: string;
    subscriptionId: string;
    lockerNumber: number;
    size: LockerSize;
    maxCapacity: number;
    description?: string;
}

export interface UpdateLockerRequest {
    name?: string;
    size?: LockerSize;
    maxCapacity?: number;
    description?: string;
    isActive?: boolean;
}

export interface UpdateLockerStatusRequest {
    status: LockerStatus;
    reason?: string;
}

export interface ReportLockerIssueRequest {
    lockerId: string;
    issueType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    reportedBy: string;
}

export interface ScheduleMaintenanceRequest {
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
    scheduledDate: string;
    estimatedDurationHours: number;
    assignedTo: string;
    tasks: string[];
    notes?: string;
}

// ==========================================
// LOCKER ADMIN REPOSITORY
// ==========================================

export class LockerAdminRepository {
    private readonly baseUrl = '/admin/lockers';

    // ==========================================
    // LOCKER CRUD OPERATIONS
    // ==========================================

    /**
     * Get all lockers with advanced filtering
     */
    async getAllLockers(filters: LockerListFilters = {}): Promise<PaginatedResponse<LockerSummary>> {
        const queryParams = new URLSearchParams();

        if (filters.locationId) queryParams.append('locationId', filters.locationId);
        if (filters.subscriptionId) queryParams.append('subscriptionId', filters.subscriptionId);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.size) queryParams.append('size', filters.size);
        if (filters.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
        if (filters.maintenanceStatus) queryParams.append('maintenanceStatus', filters.maintenanceStatus);
        if (filters.page !== undefined) queryParams.append('page', String(filters.page));
        if (filters.size !== undefined) queryParams.append('size', String(filters.size));
        if (filters.sort) queryParams.append('sort', filters.sort);

        const response = await apiClient.get<ApiResponse<SpringBootPageResponse<any>>>(
            `${this.baseUrl}?${queryParams.toString()}`
        );

        const paginated = transformSpringPageToPaginated(response.data);

        return {
            ...paginated,
            data: paginated.data.map((locker) => this.normalizeLockerSummary(locker)),
        };
    }

    /**
     * Get locker details by ID
     */
    async getLockerById(lockerId: string): Promise<LockerDetails> {
        const response = await apiClient.get<ApiResponse<any>>(
            `${this.baseUrl}/${lockerId}`
        );
        return this.normalizeLockerDetails(response.data);
    }

    /**
     * Create a new locker
     */
    async createLocker(data: CreateLockerRequest): Promise<LockerDetails> {
        const response = await apiClient.post<ApiResponse<LockerDetails>>(
            this.baseUrl,
            data
        );
        return response.data;
    }

    /**
     * Update locker information
     */
    async updateLocker(lockerId: string, data: UpdateLockerRequest): Promise<LockerDetails> {
        const response = await apiClient.put<ApiResponse<LockerDetails>>(
            `${this.baseUrl}/${lockerId}`,
            data
        );
        return response.data;
    }

    /**
     * Update locker status
     */
    async updateLockerStatus(lockerId: string, data: UpdateLockerStatusRequest): Promise<LockerDetails> {
        const response = await apiClient.patch<ApiResponse<LockerDetails>>(
            `${this.baseUrl}/${lockerId}/status`,
            data
        );
        return response.data;
    }

    /**
     * Delete a locker (soft delete)
     */
    async deleteLocker(lockerId: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${lockerId}`);
    }

    /**
     * Bulk update locker statuses
     */
    async bulkUpdateStatus(lockerIds: string[], status: LockerStatus): Promise<void> {
        await apiClient.post(`${this.baseUrl}/bulk-status`, {
            lockerIds,
            status,
        });
    }

    // ==========================================
    // ISSUE MANAGEMENT
    // ==========================================

    /**
     * Get all issues for a locker
     */
    async getLockerIssues(
        lockerId: string,
        status?: LockerIssueStatus
    ): Promise<LockerIssue[]> {
        const queryParams = new URLSearchParams();
        if (status) {
            queryParams.set('status', status);
        }

        const response = await apiClient.get<
            ApiResponse<LockerIssue[] | SpringBootPageResponse<LockerIssue>>
        >(
            `${this.baseUrl}/${lockerId}/issues${
                queryParams.toString() ? `?${queryParams.toString()}` : ''
            }`
        );

        const rawIssues = response.data;
        const issuesArray = Array.isArray(rawIssues)
            ? rawIssues
            : this.isSpringPageResponse<LockerIssue>(rawIssues)
                ? rawIssues.content
                : [];

        if (!Array.isArray(rawIssues) && !this.isSpringPageResponse<LockerIssue>(rawIssues)) {
            console.warn('Unexpected response format from getLockerIssues:', rawIssues);
        }

        return issuesArray.map((issue) => this.normalizeLockerIssue(issue));
    }

    /**
     * Report a new issue
     */
    async reportIssue(data: ReportLockerIssueRequest, userId: number): Promise<LockerIssue> {
        const response = await apiClient.post<ApiResponse<LockerIssue>>(
            `${this.baseUrl}/${data.lockerId}/issues?userId=${userId}`,
            data
        );
        return this.normalizeLockerIssue(response.data);
    }



    /**
     * Update an existing issue
     */
    async updateIssue(
        issueId: string,
        data: UpdateLockerIssuePayload
    ): Promise<LockerIssue> {
        const response = await apiClient.patch<ApiResponse<LockerIssue>>(
            `${this.baseUrl}/issues/${issueId}`,
            data
        );
        return this.normalizeLockerIssue(response.data);
    }

    /**
     * Resolve an issue
     */
    async resolveIssue(
        issueId: string,
        data: ResolveLockerIssuePayload
    ): Promise<LockerIssue> {
        const response = await apiClient.post<ApiResponse<LockerIssue>>(
            `${this.baseUrl}/issues/${issueId}/resolve`,
            data
        );
        return this.normalizeLockerIssue(response.data);
    }

    /**
     * Get all open issues across all lockers
     */
    async getAllOpenIssues(): Promise<LockerIssue[]> {
        try {
            const response = await apiClient.get<
                ApiResponse<LockerIssue[] | SpringBootPageResponse<LockerIssue>>
            >(`${this.baseUrl}/issues`, {
                headers: { Accept: 'application/json' },
            });

            const rawIssues = response.data;
            const issuesArray = Array.isArray(rawIssues)
                ? rawIssues
                : this.isSpringPageResponse<LockerIssue>(rawIssues)
                    ? rawIssues.content
                    : [];

            if (!Array.isArray(rawIssues) && !this.isSpringPageResponse<LockerIssue>(rawIssues)) {
                console.warn(
                    'Unexpected response format from getAllOpenIssues:',
                    rawIssues
                );
            }

            return issuesArray.map((issue) => this.normalizeLockerIssue(issue));
        } catch (error: any) {
            console.error('Failed to fetch open issues:', error);
            throw new Error(error?.message ?? 'Failed to fetch open issues');
        }
    }

    // ==========================================
    // MAINTENANCE MANAGEMENT
    // ==========================================

    /**
     * Get maintenance history for a locker
     */
    async getMaintenanceHistory(lockerId: string): Promise<LockerMaintenanceRecord[]> {
        const response = await apiClient.get<ApiResponse<LockerMaintenanceRecord[]>>(
            `${this.baseUrl}/${lockerId}/maintenance/history`
        );
        return response.data;
    }

    /**
     * Schedule maintenance for a locker
     */
    async scheduleMaintenance(
        lockerId: string,
        data: ScheduleMaintenanceRequest
    ): Promise<LockerMaintenanceRecord> {
        const response = await apiClient.post<ApiResponse<LockerMaintenanceRecord>>(
            `${this.baseUrl}/${lockerId}/maintenance`,
            data
        );
        return response.data;
    }

    /**
     * Update maintenance record
     */
    async updateMaintenance(
        maintenanceId: string,
        data: Partial<ScheduleMaintenanceRequest>
    ): Promise<LockerMaintenanceRecord> {
        const response = await apiClient.patch<ApiResponse<LockerMaintenanceRecord>>(
            `${this.baseUrl}/maintenance/${maintenanceId}`,
            data
        );
        return response.data;
    }

    /**
     * Complete maintenance
     */
    async completeMaintenance(
        maintenanceId: string,
        completionData: {
            actualDurationHours: number;
            completedTasks: string[];
            findings?: string;
            partsUsed?: string[];
            laborHours?: number;
            totalCost?: number;
            nextMaintenanceDue?: string;
            notes?: string;
        }
    ): Promise<LockerMaintenanceRecord> {
        const response = await apiClient.post<ApiResponse<LockerMaintenanceRecord>>(
            `${this.baseUrl}/maintenance/${maintenanceId}/complete`,
            completionData
        );
        return response.data;
    }

    // ==========================================
    // ANALYTICS & STATS
    // ==========================================

    /**
     * Get locker statistics
     */
    // async getLockerStats(): Promise<{
    //     totalLockers: number;
    //     availableLockers: number;
    //     occupiedLockers: number;
    //     maintenanceLockers: number;
    //     outOfServiceLockers: number;
    //     utilizationRate: number;
    //     averageOccupancyHours: number;
    // }> {
    //     const response = await apiClient.get(`${this.baseUrl}/stats`);
    //     return response.data;
    // }
    private isSpringPageResponse<T>(value: unknown): value is SpringBootPageResponse<T> {
        return (
            !!value &&
            typeof value === 'object' &&
            Array.isArray((value as SpringBootPageResponse<T>).content)
        );
    }

    private normalizeLockerIssue(issue: any): LockerIssue {
        return {
            ...issue,
            attachments: Array.isArray(issue?.attachments) ? issue.attachments : [],
            commentsCount:
                typeof issue?.commentsCount === 'number' ? issue.commentsCount : 0,
            statusHistory: Array.isArray(issue?.statusHistory)
                ? issue.statusHistory
                : [],
        };
    }

    private normalizeLockerSummary(locker: any): LockerSummary {
        return {
            id: locker.id,
            code: locker.code,
            lockerNumber: locker.lockerNumber !== undefined && locker.lockerNumber !== null
                ? String(locker.lockerNumber)
                : locker.name ?? locker.code,
            name: locker.name,
            subscriptionId: locker.subscriptionId,
            locationId: locker.location?.id ?? locker.locationId ?? '',
            locationName: locker.location?.name ?? locker.locationName,
            size: locker.size,
            status: locker.status,
            maintenanceStatus: locker.maintenanceStatus,
            // description: locker.description,
            isActive: locker.isActive,
            maxCapacity: locker.maxCapacity,
            availableCapacity: locker.availableCapacity,
        };
    }

    private normalizeActiveReservation(reservation: any): LockerActiveReservation {
        return {
            id: reservation.id,
            userId: reservation.userId,
            lockerId: reservation.lockerId,
            lockerNumber: reservation.lockerNumber ? String(reservation.lockerNumber) : undefined,
            orderId: reservation.orderId,
            reservedFrom: reservation.reservedFrom,
            reservedUntil: reservation.reservedUntil,
            reservationType: reservation.reservationType,
            status: reservation.status,
            accessCode: reservation.accessCode,
            createdAt: reservation.createdAt,
        };
    }

    private normalizeMaintenanceRecord(record: any): LockerMaintenanceRecord {
        return {
            ...record,
            tasks: record.tasks ?? [],
            completedTasks: record.completedTasks ?? [],
            partsUsed: record.partsUsed ?? [],
        };
    }

    private normalizeLockerDetails(locker: any): LockerDetails {
        const summary = this.normalizeLockerSummary(locker);

        return {
            ...summary,
            description: locker.description ?? null,
            isActive: locker.isActive ?? true,
            maintenanceStatus: locker.maintenanceStatus,
            lastMaintenanceDate: locker.lastMaintenanceDate ?? null,
            nextMaintenanceDue: locker.nextMaintenanceDue ?? null,
            location: locker.location,
            activeReservations: Array.isArray(locker.activeReservations)
                ? locker.activeReservations.map((reservation: any) => this.normalizeActiveReservation(reservation))
                : [],
            maintenanceHistory: Array.isArray(locker.maintenanceHistory)
                ? locker.maintenanceHistory.map((record: any) => this.normalizeMaintenanceRecord(record))
                : [],
            issueReports: Array.isArray(locker.issueReports) ? locker.issueReports : [],
            metadata: locker.metadata ?? undefined,
            createdAt: locker.createdAt,
            updatedAt: locker.updatedAt,
        };
    }
}

// Export singleton instance
export const lockerAdminRepository = new LockerAdminRepository();