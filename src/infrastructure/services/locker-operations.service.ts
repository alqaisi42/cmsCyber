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
    LockerLocationDigest,
    LockerLocationOverview,
    LockerSubscriptionDigest,
    ScheduleMaintenancePayload,
    UpdateIssuePayload,
    UpdateLockerStatusPayload,
    UpdateMaintenancePayload,
} from '../../core/entities/locker-operations';

interface GenericApiResponse<T = any> {
    success?: boolean;
    messageCode?: number;
    messageText?: string;
    response?: T;
    data?: T;
}

interface LocationOverviewFilters {
    subscriptionId?: string;
    status?: string;
    size?: string;
    maintenanceStatus?: string;
    isActive?: boolean;
    hasOpenIssues?: boolean;
    needsMaintenance?: boolean;
    includeReservations?: boolean;
    includeIssueCounts?: boolean;
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class LockerOperationsService {
    private readonly baseUrl = (process.env.NEXT_PUBLIC_LOCKER_API_URL || '').replace(/\/+$/, '');
    private readonly locationsTreeEndpoint =
        process.env.NEXT_PUBLIC_LOCKER_LOCATIONS_TREE_URL || '/api/v1/admin/lockers/locations/tree';

    private readonly adminLockersBasePath = '/api/v1/admin/lockers';
    private readonly adminLocationsBasePath = '/api/admin/locations';
    private readonly issueMaintenanceBasePath = '/api/admin/lockers';
    private readonly adminLockerIssuesBasePath = '/api/v1/admin/lockers/issues';

    async getLocationDigests(): Promise<LockerLocationDigest[]> {
        try {
            const treeNodes = await this.fetchLocationsTree();
            const digests = this.extractLocationNodes(treeNodes)
                .map((item) => this.mapLocationDigest(item))
                .filter((location): location is LockerLocationDigest => Boolean(location?.id));

            if (digests.length) {
                return digests;
            }
        } catch (error) {
            console.warn('Failed to load locations tree, falling back to admin locations list.', error);
        }

        const payload = await this.request<GenericApiResponse<any>>(this.adminLocationsBasePath);
        const data = this.unwrap(payload);
        const list = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : Array.isArray(data?.response)
            ? data.response
            : [];

        return list
            .map((item) => this.mapLocationDigest(item))
            .filter((location): location is LockerLocationDigest => Boolean(location?.id));
    }

    async getLocationOverview(locationId: string, filters: LocationOverviewFilters = {}): Promise<LockerLocationOverview> {
        if (!locationId) {
            throw new Error('Location id is required to load overview');
        }

        const searchParams = new URLSearchParams();
        if (filters.subscriptionId) searchParams.set('subscriptionId', filters.subscriptionId);
        if (filters.status) searchParams.set('status', filters.status);
        if (filters.size) searchParams.set('size', filters.size);
        if (filters.maintenanceStatus) searchParams.set('maintenanceStatus', filters.maintenanceStatus);
        if (typeof filters.isActive === 'boolean') searchParams.set('isActive', String(filters.isActive));
        if (typeof filters.hasOpenIssues === 'boolean') searchParams.set('hasOpenIssues', String(filters.hasOpenIssues));
        if (typeof filters.needsMaintenance === 'boolean')
            searchParams.set('needsMaintenance', String(filters.needsMaintenance));
        if (typeof filters.includeReservations === 'boolean')
            searchParams.set('includeReservations', String(filters.includeReservations));
        if (typeof filters.includeIssueCounts === 'boolean')
            searchParams.set('includeIssueCounts', String(filters.includeIssueCounts));

        const query = searchParams.toString();

        const [overviewResult, lockersResult, subscriptionsResult, activeReservationsResult, upcomingReservationsResult] =
            await Promise.allSettled([
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/lockers/overview${query ? `?${query}` : ''}`
                ),
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/lockers${query ? `?${query}` : ''}`
                ),
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/subscriptions`
                ),
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/reservations/active`
                ),
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/reservations/upcoming`
                ),
            ]);

        if (overviewResult.status !== 'fulfilled') {
            throw overviewResult.reason instanceof Error
                ? overviewResult.reason
                : new Error('Failed to load location overview');
        }

        if (lockersResult.status !== 'fulfilled') {
            console.warn('Failed to fetch location lockers list', lockersResult.reason);
        }
        if (subscriptionsResult.status !== 'fulfilled') {
            console.warn('Failed to fetch location subscriptions', subscriptionsResult.reason);
        }
        if (activeReservationsResult.status !== 'fulfilled') {
            console.warn('Failed to fetch active reservations', activeReservationsResult.reason);
        }
        if (upcomingReservationsResult.status !== 'fulfilled') {
            console.warn('Failed to fetch upcoming reservations', upcomingReservationsResult.reason);
        }

        const overviewPayload = overviewResult.value;
        const lockersPayload = lockersResult.status === 'fulfilled' ? lockersResult.value : null;
        const subscriptionsPayload = subscriptionsResult.status === 'fulfilled' ? subscriptionsResult.value : null;
        const activeReservationsPayload = activeReservationsResult.status === 'fulfilled' ? activeReservationsResult.value : null;
        const upcomingReservationsPayload =
            upcomingReservationsResult.status === 'fulfilled' ? upcomingReservationsResult.value : null;

        const overviewData = this.unwrap(overviewPayload)?.data ?? this.unwrap(overviewPayload);
        const overviewRoot = overviewData?.data ?? overviewData ?? {};
        const locationRaw = overviewRoot?.location ?? overviewData?.location ?? null;
        const statisticsRaw = overviewRoot?.statistics ?? overviewData?.statistics ?? {};
        const lockersRaw = overviewRoot?.lockers ?? overviewRoot?.data ?? [];

        const lockersResponse = this.unwrap(lockersPayload);
        const lockersList = Array.isArray(lockersResponse?.data)
            ? lockersResponse.data
            : Array.isArray(lockersResponse)
            ? lockersResponse
            : [];

        const subscriptionsRaw = this.extractArray(subscriptionsPayload);
        const activeReservationsRaw = this.extractArray(activeReservationsPayload);
        const upcomingReservationsRaw = this.extractArray(upcomingReservationsPayload);

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
            totalLockers: this.normalizeNumber(statisticsRaw?.totalLockers, lockersList.length || lockersRaw?.length || 0),
            availableLockers: this.normalizeNumber(statisticsRaw?.availableLockers),
            occupiedLockers: this.normalizeNumber(statisticsRaw?.occupiedLockers),
            maintenanceLockers: this.normalizeNumber(statisticsRaw?.maintenanceLockers ?? statisticsRaw?.maintenanceLockersCount),
        };

        const lockersSource = Array.isArray(lockersRaw) && lockersRaw.length ? lockersRaw : lockersList;
        const lockers = Array.isArray(lockersSource)
            ? lockersSource.map((locker) => this.mapLockerDetails(locker))
            : [];

        const subscriptions: LockerSubscriptionDigest[] = subscriptionsRaw.map((item) => ({
            id: String(item.id ?? item.subscriptionId ?? ''),
            name: item.name ?? item.planName ?? item.subscriptionName ?? item.code ?? undefined,
            ownerName: item.ownerName ?? item.owner ?? item.userName ?? item.accountOwner,
            lockerCount: this.normalizeNumber(item.lockerCount ?? item.totalLockers ?? item.lockersCount),
            activeReservations: this.normalizeNumber(
                item.activeReservations ?? item.activeReservationsCount ?? item.reservationCount
            ),
            status: item.status ?? item.subscriptionStatus ?? item.state,
        }));

        const mergeReservations = [...activeReservationsRaw, ...upcomingReservationsRaw];
        const upcomingKeys = new Set(
            upcomingReservationsRaw.map((reservation) =>
                String(
                    reservation.id ??
                        reservation.reservationId ??
                        reservation.orderId ??
                        `${reservation.lockerId ?? ''}-${reservation.reservedFrom ?? reservation.startTime ?? ''}`
                )
            )
        );

        const reservationsMap = new Map<string, LockerReservation>();

        for (const item of mergeReservations) {
            const key = String(
                item.id ??
                    item.reservationId ??
                    item.orderId ??
                    `${item.lockerId ?? ''}-${item.reservedFrom ?? item.startTime ?? ''}`
            );

            const isUpcoming = upcomingKeys.has(key);
            const status = this.normalizeReservationStatus(item.status ?? item.reservationStatus, isUpcoming ? 'SCHEDULED' : 'ACTIVE');

            reservationsMap.set(key, {
                id: String(item.id ?? item.reservationId ?? key),
                userId: Number(item.userId ?? item.user?.id ?? 0),
                userName: item.userName ?? item.user?.name ?? 'Unknown user',
                lockerId: String(item.lockerId ?? item.locker?.id ?? ''),
                lockerNumber: String(item.lockerNumber ?? item.locker?.number ?? ''),
                lockerSize: (item.lockerSize ?? item.size ?? item.locker?.size ?? 'MEDIUM') as LockerReservation['lockerSize'],
                locationId: String(item.locationId ?? item.location?.id ?? locationId),
                locationName: location?.name ?? item.locationName ?? item.location?.name ?? 'Unknown location',
                locationAddress: location?.address ?? item.locationAddress ?? item.location?.address ?? undefined,
                status,
                reservationType: item.reservationType ?? item.type ?? 'GENERAL',
                orderId: item.orderId ?? item.order?.id ?? undefined,
                reservedFrom: item.reservedFrom ?? item.startTime ?? item.startDate ?? '',
                reservedUntil: item.reservedUntil ?? item.endTime ?? item.endDate ?? '',
                accessCode: item.accessCode ?? undefined,
                accessCodeExpiresAt: item.accessCodeExpiresAt ?? undefined,
                qrCode: item.qrCode ?? undefined,
                notes: item.notes ?? item.comments ?? undefined,
                createdAt: item.createdAt ?? item.timestamp ?? new Date().toISOString(),
                updatedAt: item.updatedAt ?? undefined,
            });
        }

        const reservations = Array.from(reservationsMap.values());

        return {
            location,
            statistics,
            lockers,
            reservations,
            subscriptions,
        };
    }

    async getLockerIssuesAndMaintenance(lockerId: string): Promise<LockerIssuesMaintenanceOverview> {
        const payload = await this.request<GenericApiResponse<any>>(
            `${this.issueMaintenanceBasePath}/${lockerId}/issues-maintenance/overview`
        );
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
        const response = await this.request<GenericApiResponse<any>>(this.adminLockersBasePath, {
            method: 'POST',
            body: payload,
        });
        const data = response.response ?? response.data ?? response;
        return this.mapLockerDetails(data);
    }

    async bulkCreateLockers(payload: BulkCreateLockerPayload): Promise<{ message: string }> {
        const response = await this.request<GenericApiResponse<any>>(
            `${this.adminLockersBasePath}/bulk`,
            {
                method: 'POST',
                body: payload,
            }
        );
        const message = response.messageText ?? response.message ?? 'Bulk operation completed';
        return { message };
    }

    async updateLockerStatus(lockerId: string, payload: UpdateLockerStatusPayload): Promise<void> {
        await this.request(`${this.adminLockersBasePath}/${lockerId}/status`, {
            method: 'PUT',
            body: payload,
        });
    }

    async createIssue(payload: CreateIssuePayload): Promise<LockerIssue> {
        const response = await this.request<GenericApiResponse<any>>(this.adminLockerIssuesBasePath, {
            method: 'POST',
            body: payload,
        });
        const data = response.response ?? response.data ?? response;
        return this.mapLockerIssue(data);
    }

    async updateIssue(issueId: string, payload: UpdateIssuePayload): Promise<void> {
        await this.request(`${this.issueMaintenanceBasePath}/issues/${issueId}`, {
            method: 'PUT',
            body: payload,
        });
    }

    async addIssueComment(issueId: string, comment: { comment: string; isInternal?: boolean }): Promise<void> {
        await this.request(`${this.issueMaintenanceBasePath}/issues/${issueId}/comments`, {
            method: 'POST',
            body: comment,
        });
    }

    async scheduleMaintenance(lockerId: string, payload: ScheduleMaintenancePayload): Promise<LockerMaintenanceRecord> {
        const response = await this.request<GenericApiResponse<any>>(
            `${this.issueMaintenanceBasePath}/${lockerId}/maintenance`,
            {
                method: 'POST',
                body: {
                    lockerId,
                    ...payload,
                },
            }
        );
        const data = response.response ?? response.data ?? response;
        return this.mapMaintenanceRecord({ ...data, lockerId });
    }

    async updateMaintenance(maintenanceId: string, payload: UpdateMaintenancePayload): Promise<void> {
        await this.request(`${this.issueMaintenanceBasePath}/maintenance/${maintenanceId}`, {
            method: 'PATCH',
            body: payload,
        });
    }

    private mapLocationDigest(dto: any): LockerLocationDigest | null {
        if (!dto) {
            return null;
        }

        const id = dto.id ?? dto.locationId ?? dto.location?.id;
        if (!id) {
            return null;
        }

        return {
            id: String(id),
            code: dto.code ?? dto.locationCode ?? dto.location?.code ?? undefined,
            name: dto.name ?? dto.locationName ?? dto.location?.name ?? dto.title ?? 'Unknown location',
            address: dto.address ?? dto.locationAddress ?? dto.location?.address ?? null,
            totalLockers: this.normalizeNumber(
                dto.totalLockers ?? dto.lockersCount ?? dto.lockerCount ?? dto.total ?? dto.totalCount ?? dto.totalLockersCount
            ),
            availableLockers: this.normalizeNumber(
                dto.availableLockers ??
                    dto.availableLockerCount ??
                    dto.available ??
                    dto.availableCount ??
                    dto.openLockers ??
                    dto.freeLockers
            ),
            maintenanceLockers: this.normalizeNumber(
                dto.maintenanceLockers ??
                    dto.maintenanceLockersCount ??
                    dto.maintenanceCount ??
                    dto.pendingMaintenance ??
                    dto.attentionRequired ??
                    dto.needsMaintenanceCount ??
                    0
            ),
        };
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

    private extractArray(payload: GenericApiResponse<any> | any): any[] {
        const data = this.unwrap(payload);
        if (Array.isArray(data)) {
            return data;
        }
        if (Array.isArray(data?.data)) {
            return data.data;
        }
        if (Array.isArray(data?.response)) {
            return data.response;
        }
        return [];
    }

    private unwrap<T = any>(payload: GenericApiResponse<T> | any): any {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return payload;
        }

        const maybeResponse = (payload as GenericApiResponse<any>).response;
        const maybeData = (payload as GenericApiResponse<any>).data;

        return maybeResponse ?? maybeData ?? payload;
    }

    private normalizeReservationStatus(
        value: any,
        fallback: LockerReservation['status'] = 'ACTIVE'
    ): LockerReservation['status'] {
        const normalized = String(value ?? '').toUpperCase();
        const allowed: LockerReservation['status'][] = ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'SCHEDULED'];
        if (allowed.includes(normalized as LockerReservation['status'])) {
            return normalized as LockerReservation['status'];
        }
        return fallback;
    }

    private normalizeNumber(value: any, fallback = 0): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    private extractLocationNodes(nodes: any[]): any[] {
        const stack = Array.isArray(nodes) ? [...nodes] : [];
        const results: any[] = [];

        while (stack.length) {
            const node = stack.shift();
            if (!node) continue;

            if (String(node.type ?? '').toUpperCase() === 'LOCATION') {
                results.push(node);
            }

            const children = Array.isArray(node.children) ? node.children : [];
            stack.push(...children);
        }

        return results;
    }

    private async fetchLocationsTree(): Promise<any[]> {
        const headers: HeadersInit = {
            Accept: 'application/json',
        };

        const token = this.resolveToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.buildUrl(this.locationsTreeEndpoint), {
            method: 'GET',
            headers,
            cache: 'no-store',
        });

        if (!response.ok) {
            const fallbackMessage = response.statusText || 'Failed to load locations tree';
            const errorText = await response.text().catch(() => '');

            if (!errorText) {
                throw new Error(fallbackMessage);
            }

            try {
                const parsed = JSON.parse(errorText);
                const message = parsed?.message ?? parsed?.messageText ?? parsed?.error ?? fallbackMessage;
                throw new Error(message || fallbackMessage);
            } catch (parseError) {
                throw new Error(errorText || fallbackMessage);
            }
        }

        const payload = await response.json().catch(() => null);
        if (!payload) {
            return [];
        }

        if (Array.isArray(payload)) {
            return payload;
        }

        if (Array.isArray(payload.data)) {
            return payload.data;
        }

        if (Array.isArray(payload.response)) {
            return payload.response;
        }

        return [];
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

        const response = await fetch(this.buildUrl(path), {
            method: init?.method ?? 'GET',
            headers,
            body:
                init?.body !== undefined && init?.body !== null
                    ? typeof init.body === 'string'
                        ? init.body
                        : JSON.stringify(init.body)
                    : undefined,
            cache: 'no-store',
        });

        const text = await response.text();
        let data: any = {};

        if (text) {
            try {
                data = JSON.parse(text);
            } catch (error) {
                data = { message: text };
            }
        }

        if (!response.ok || data?.success === false) {
            const message = data?.messageText ?? data?.message ?? data?.error ?? response.statusText;
            throw new Error(message || 'Request failed');
        }

        return (data as T) ?? ({} as T);
    }

    private buildUrl(path: string): string {
        if (!path) {
            return this.baseUrl || '';
        }

        if (this.isAbsoluteUrl(path)) {
            return path;
        }

        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

        if (!this.baseUrl) {
            return normalizedPath;
        }

        return `${this.baseUrl}${normalizedPath}`;
    }

    private isAbsoluteUrl(url: string): boolean {
        return /^https?:\/\//i.test(url);
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
