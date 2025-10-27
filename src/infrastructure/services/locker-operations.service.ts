// src/infrastructure/services/locker-operations.service.ts
// Client for locker operations endpoints (locations, issues, maintenance).

import {
    LockerDetails,
    LockerIssue,
    LockerMaintenanceRecord,
    LockerReservation,
    LockerSummary,
    LockerStatus,
} from '../../core/entities/lockers';
import {
    BulkCreateLockerPayload,
    CreateIssuePayload,
    CreateLockerPayload,
    LockerIssuesMaintenanceOverview,
    LockerListResult,
    LockerLocationDigest,
    LockerLocationOverview,
    LockerSubscriptionDigest,
    ScheduleMaintenancePayload,
    UpdateIssuePayload,
    UpdateLockerStatusPayload,
    UpdateMaintenancePayload,
} from '../../core/entities/locker-operations';

interface LockerListApiResponse {
    success?: boolean;
    messageCode?: number;
    messageText?: string;
    response?: {
        content?: any[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
        size?: number;
    };
}

interface GenericApiResponse<T = any> {
    success?: boolean;
    messageCode?: number;
    messageText?: string;
    response?: T;
    data?: T;
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class LockerOperationsService {
    private readonly baseUrl = process.env.NEXT_PUBLIC_LOCKER_API_URL || 'http://148.230.111.245:32080';

    async getLockers(params: { page?: number; size?: number; locationId?: string } = {}): Promise<LockerListResult> {
        const searchParams = new URLSearchParams();
        if (typeof params.page === 'number') {
            searchParams.set('page', String(params.page));
        }
        if (typeof params.size === 'number') {
            searchParams.set('size', String(params.size));
        }
        if (params.locationId) {
            searchParams.set('locationId', params.locationId);
        }

        const query = searchParams.toString();
        const payload = await this.request<LockerListApiResponse>(`/lockers${query ? `?${query}` : ''}`);
        const response = payload.response ?? payload.data ?? payload;
        const content = Array.isArray(response?.content) ? response?.content : [];

        const lockers = content.map((item) => this.mapLockerSummary(item));
        const locations = this.extractLocations(content);

        return {
            lockers,
            locations,
            totalElements: typeof response?.totalElements === 'number' ? response.totalElements : lockers.length,
            page: typeof response?.number === 'number' ? response.number : params.page ?? 0,
            size: typeof response?.size === 'number' ? response.size : params.size ?? lockers.length,
        };
    }

    async getLocationOverview(locationId: string): Promise<LockerLocationOverview> {
        const payload = await this.request<GenericApiResponse<any>>(`/locations/${locationId}/lockers`);
        const data = payload.response ?? payload.data ?? payload;

        const locationRaw = data?.location ?? data?.response?.location ?? null;
        const statisticsRaw = data?.statistics ?? data?.response?.statistics ?? {};
        const lockersRaw = data?.lockers ?? data?.response?.lockers ?? data?.response?.content ?? [];
        const subscriptionsRaw = data?.subscriptions ?? data?.response?.subscriptions ?? [];
        const reservationsRaw = data?.reservations ?? data?.response?.reservations ?? [];

        const location = locationRaw
            ? {
                  id: String(locationRaw.id ?? locationId),
                  name: locationRaw.name ?? locationRaw.title ?? 'Unknown Location',
                  address: locationRaw.address ?? null,
                  latitude:
                      typeof locationRaw.latitude === 'number'
                          ? locationRaw.latitude
                          : typeof locationRaw.lat === 'number'
                          ? locationRaw.lat
                          : null,
                  longitude:
                      typeof locationRaw.longitude === 'number'
                          ? locationRaw.longitude
                          : typeof locationRaw.lng === 'number'
                          ? locationRaw.lng
                          : null,
              }
            : null;

        const statistics = {
            totalLockers: this.normalizeNumber(statisticsRaw?.totalLockers, lockersRaw?.length ?? 0),
            availableLockers: this.normalizeNumber(statisticsRaw?.availableLockers),
            occupiedLockers: this.normalizeNumber(statisticsRaw?.occupiedLockers),
            maintenanceLockers: this.normalizeNumber(statisticsRaw?.maintenanceLockers),
        };

        const lockers = Array.isArray(lockersRaw)
            ? lockersRaw.map((locker) => this.mapLockerDetails(locker))
            : [];

        const subscriptions: LockerSubscriptionDigest[] = Array.isArray(subscriptionsRaw)
            ? subscriptionsRaw.map((item) => ({
                  id: String(item.id ?? item.subscriptionId ?? ''),
                  name: item.name ?? item.planName ?? item.subscriptionName,
                  ownerName: item.ownerName ?? item.owner ?? item.userName,
                  lockerCount: this.normalizeNumber(item.lockerCount ?? item.totalLockers),
                  activeReservations: this.normalizeNumber(item.activeReservations ?? item.reservationCount),
                  status: item.status ?? item.subscriptionStatus,
              }))
            : [];

        const reservations: LockerReservation[] = Array.isArray(reservationsRaw)
            ? reservationsRaw.map((item) => ({
                  id: String(item.id ?? item.reservationId ?? ''),
                  userId: Number(item.userId ?? item.user?.id ?? 0),
                  userName: item.userName ?? item.user?.name ?? 'Unknown user',
                  lockerId: String(item.lockerId ?? item.locker?.id ?? ''),
                  lockerNumber: item.lockerNumber ?? item.locker?.number ?? undefined,
                  locationId: String(item.locationId ?? item.location?.id ?? ''),
                  locationName: item.locationName ?? item.location?.name ?? undefined,
                  reservedFrom: item.reservedFrom ?? item.startTime ?? item.startDate ?? '',
                  reservedUntil: item.reservedUntil ?? item.endTime ?? item.endDate ?? '',
                  reservationType: item.reservationType ?? item.type ?? 'GENERAL',
                  status: item.status ?? item.reservationStatus ?? 'ACTIVE',
                  notes: item.notes ?? undefined,
                  createdAt: item.createdAt ?? undefined,
              }))
            : [];

        return {
            location,
            statistics,
            lockers,
            reservations,
            subscriptions,
        };
    }

    async getLockerIssuesAndMaintenance(lockerId: string): Promise<LockerIssuesMaintenanceOverview> {
        const payload = await this.request<GenericApiResponse<any>>(`/lockers/${lockerId}/issues-maintenance`);
        const data = payload.response ?? payload.data ?? payload;

        const lockerRaw = data?.locker ?? null;
        const issuesRaw = data?.issues ?? [];
        const maintenanceRaw = data?.maintenanceRecords ?? data?.maintenance ?? [];

        return {
            locker: lockerRaw ? this.mapLockerSummary(lockerRaw) : null,
            issues: Array.isArray(issuesRaw) ? issuesRaw.map((issue) => this.mapLockerIssue(issue)) : [],
            maintenanceRecords: Array.isArray(maintenanceRaw)
                ? maintenanceRaw.map((record) => this.mapMaintenanceRecord(record))
                : [],
        };
    }

    async createLocker(payload: CreateLockerPayload): Promise<LockerDetails> {
        const response = await this.request<GenericApiResponse<any>>('/lockers', {
            method: 'POST',
            body: payload,
        });
        const data = response.response ?? response.data ?? response;
        return this.mapLockerDetails(data);
    }

    async bulkCreateLockers(payload: BulkCreateLockerPayload): Promise<{ message: string }> {
        const response = await this.request<GenericApiResponse<any>>('/lockers/bulk', {
            method: 'POST',
            body: payload,
        });
        const message = response.messageText ?? response.message ?? 'Bulk operation completed';
        return { message };
    }

    async updateLockerStatus(lockerId: string, payload: UpdateLockerStatusPayload): Promise<void> {
        await this.request(`/lockers/${lockerId}/status`, {
            method: 'PUT',
            body: payload,
        });
    }

    async createIssue(payload: CreateIssuePayload): Promise<LockerIssue> {
        const response = await this.request<GenericApiResponse<any>>('/issues', {
            method: 'POST',
            body: payload,
        });
        const data = response.response ?? response.data ?? response;
        return this.mapLockerIssue(data);
    }

    async updateIssue(issueId: string, payload: UpdateIssuePayload): Promise<void> {
        await this.request(`/issues/${issueId}`, {
            method: 'PATCH',
            body: payload,
        });
    }

    async addIssueComment(issueId: string, comment: { comment: string; isInternal?: boolean }): Promise<void> {
        await this.request(`/issues/${issueId}/comments`, {
            method: 'POST',
            body: comment,
        });
    }

    async scheduleMaintenance(lockerId: string, payload: ScheduleMaintenancePayload): Promise<LockerMaintenanceRecord> {
        const response = await this.request<GenericApiResponse<any>>('/maintenance', {
            method: 'POST',
            body: {
                lockerId,
                ...payload,
            },
        });
        const data = response.response ?? response.data ?? response;
        return this.mapMaintenanceRecord({ ...data, lockerId });
    }

    async updateMaintenance(maintenanceId: string, payload: UpdateMaintenancePayload): Promise<void> {
        await this.request(`/maintenance/${maintenanceId}`, {
            method: 'PATCH',
            body: payload,
        });
    }

    private extractLocations(content: any[]): LockerLocationDigest[] {
        const lookup = new Map<string, LockerLocationDigest>();
        for (const item of content) {
            const locationId = String(item.locationId ?? item.location?.id ?? '');
            if (!locationId) continue;
            const existing = lookup.get(locationId);
            const status = String(item.status ?? '').toUpperCase();
            const maintenance = String(item.maintenanceStatus ?? '').toUpperCase();

            const totals = {
                totalLockers: 1,
                availableLockers: status === 'AVAILABLE' ? 1 : 0,
                maintenanceLockers:
                    maintenance === 'UNDER_MAINTENANCE' || maintenance === 'REQUIRES_MAINTENANCE' ? 1 : 0,
            };

            if (existing) {
                existing.totalLockers += totals.totalLockers;
                existing.availableLockers += totals.availableLockers;
                existing.maintenanceLockers += totals.maintenanceLockers;
            } else {
                lookup.set(locationId, {
                    id: locationId,
                    code: item.location?.code ?? undefined,
                    name: item.locationName ?? item.location?.name ?? 'Unknown location',
                    address: item.location?.address ?? null,
                    totalLockers: totals.totalLockers,
                    availableLockers: totals.availableLockers,
                    maintenanceLockers: totals.maintenanceLockers,
                });
            }
        }

        return Array.from(lookup.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    private mapLockerSummary(dto: any): LockerSummary {
        return {
            id: String(dto.id ?? dto.lockerId ?? ''),
            code: dto.code ?? dto.lockerCode ?? '',
            lockerNumber: dto.lockerNumber ? String(dto.lockerNumber) : dto.code ?? '',
            name: dto.name ?? dto.displayName ?? undefined,
            subscriptionId: dto.subscriptionId ?? dto.subscription?.id ?? undefined,
            locationId: String(dto.locationId ?? dto.location?.id ?? ''),
            locationName: dto.locationName ?? dto.location?.name ?? undefined,
            size: (dto.size ?? dto.lockerSize ?? 'MEDIUM') as LockerSummary['size'],
            status: (dto.status ?? 'AVAILABLE') as LockerStatus,
            maintenanceStatus: dto.maintenanceStatus ?? dto.maintenance?.status ?? undefined,
            dimensions: dto.dimensions,
            features: dto.features,
            currentReservation: dto.currentReservation,
            nextAvailableFrom: dto.nextAvailableFrom ?? null,
            isActive: dto.isActive ?? true,
            maxCapacity: typeof dto.maxCapacity === 'number' ? dto.maxCapacity : undefined,
            availableCapacity: typeof dto.availableCapacity === 'number' ? dto.availableCapacity : undefined,
            isCurrentlyAvailable: dto.isCurrentlyAvailable ?? undefined,
            availableTimeSlots: dto.availableTimeSlots,
        };
    }

    private mapLockerDetails(dto: any): LockerDetails {
        const summary = this.mapLockerSummary(dto);
        return {
            ...summary,
            description: dto.description ?? null,
            lastMaintenanceDate: dto.lastMaintenanceDate ?? null,
            nextMaintenanceDue: dto.nextMaintenanceDue ?? null,
            location: dto.location
                ? {
                      id: String(dto.location.id ?? summary.locationId ?? ''),
                      code: dto.location.code ?? undefined,
                      name: dto.location.name ?? summary.locationName ?? '',
                      address: dto.location.address ?? undefined,
                  }
                : undefined,
            activeReservations: Array.isArray(dto.activeReservations) ? dto.activeReservations : [],
            maintenanceHistory: Array.isArray(dto.maintenanceHistory)
                ? dto.maintenanceHistory.map((record: any) => this.mapMaintenanceRecord(record))
                : [],
            issueReports: Array.isArray(dto.issueReports)
                ? dto.issueReports.map((issue: any) => this.mapLockerIssue(issue))
                : [],
            metadata: dto.metadata ?? undefined,
            createdAt: dto.createdAt ?? undefined,
            updatedAt: dto.updatedAt ?? undefined,
        };
    }

    private mapLockerIssue(dto: any): LockerIssue {
        return {
            id: String(dto.id ?? ''),
            lockerId: String(dto.lockerId ?? dto.locker?.id ?? ''),
            lockerCode: dto.lockerCode ?? dto.locker?.code ?? '',
            issueType: dto.issueType ?? dto.type ?? 'GENERAL',
            severity: (dto.severity ?? 'MEDIUM').toUpperCase() as LockerIssue['severity'],
            status: (dto.status ?? 'OPEN').toUpperCase() as LockerIssue['status'],
            title: dto.title ?? dto.summary ?? 'Locker issue',
            description: dto.description ?? '',
            reportedBy: dto.reportedBy ?? dto.createdBy ?? 'system',
            reportedAt: dto.reportedAt ?? dto.createdAt ?? new Date().toISOString(),
            assignedTo: dto.assignedTo ?? dto.assignee ?? null,
            estimatedResolutionTime: dto.estimatedResolutionTime ?? null,
            resolvedAt: dto.resolvedAt ?? null,
            resolutionNotes: dto.resolutionNotes ?? null,
            attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
            commentsCount: dto.commentsCount ?? dto.comments?.length ?? 0,
            statusHistory: Array.isArray(dto.statusHistory) ? dto.statusHistory : [],
        };
    }

    private mapMaintenanceRecord(dto: any): LockerMaintenanceRecord {
        return {
            id: String(dto.id ?? dto.maintenanceId ?? ''),
            lockerId: String(dto.lockerId ?? dto.locker?.id ?? ''),
            maintenanceType: (dto.maintenanceType ?? dto.type ?? 'PREVENTIVE').toUpperCase() as LockerMaintenanceRecord['maintenanceType'],
            status: (dto.status ?? 'SCHEDULED').toUpperCase() as LockerMaintenanceRecord['status'],
            scheduledDate: dto.scheduledDate ?? dto.startTime ?? new Date().toISOString(),
            completedAt: dto.completedAt ?? dto.endTime ?? null,
            estimatedDurationHours: this.normalizeNumber(dto.estimatedDurationHours ?? dto.estimatedDuration, 0),
            actualDurationHours: dto.actualDurationHours ?? dto.actualDuration ?? null,
            assignedTo: dto.assignedTo ?? dto.assignee ?? 'Unassigned',
            tasks: Array.isArray(dto.tasks) ? dto.tasks : undefined,
            completedTasks: Array.isArray(dto.completedTasks) ? dto.completedTasks : undefined,
            findings: dto.findings ?? null,
            partsUsed: Array.isArray(dto.partsUsed) ? dto.partsUsed : undefined,
            laborHours: dto.laborHours ?? null,
            totalCost: typeof dto.totalCost === 'number' ? dto.totalCost : null,
            nextMaintenanceDue: dto.nextMaintenanceDue ?? null,
            notes: dto.notes ?? null,
            createdAt: dto.createdAt ?? new Date().toISOString(),
        } as LockerMaintenanceRecord;
    }

    private normalizeNumber(value: any, fallback = 0): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    private async request<T>(path: string, init?: { method?: RequestMethod; body?: any }): Promise<T> {
        const headers: HeadersInit = {
            Accept: 'application/json',
        };

        if (init?.body !== undefined && init?.body !== null) {
            headers['Content-Type'] = 'application/json';
        }

        const token = this.resolveToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            method: init?.method ?? 'GET',
            headers,
            body:
                init?.body !== undefined && init?.body !== null
                    ? typeof init.body === 'string'
                        ? init.body
                        : JSON.stringify(init.body)
                    : undefined,
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok || data?.success === false) {
            const message = data?.messageText ?? data?.message ?? response.statusText;
            throw new Error(message || 'Request failed');
        }

        return data as T;
    }

    private resolveToken(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }
        return (
            localStorage.getItem('auth_token') ||
            localStorage.getItem('auth-token') ||
            localStorage.getItem('token') ||
            null
        );
    }
}

export const lockerOperationsService = new LockerOperationsService();
