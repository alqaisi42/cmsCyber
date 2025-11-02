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
    private readonly proxyBasePath = '/api/v1'; // ✅ unified proxy path

    private readonly locationsTreeEndpoint =
        process.env.NEXT_PUBLIC_LOCKER_LOCATIONS_TREE_URL ||
        `${this.proxyBasePath}/admin/lockers/locations/tree`;

    private readonly adminLockersBasePath = `${this.proxyBasePath}/admin/lockers`;
    private readonly adminLocationsBasePath = `${this.proxyBasePath}/admin/locations`;
    private readonly issueMaintenanceBasePath = `${this.proxyBasePath}/admin/lockers`;
    private readonly adminLockerIssuesBasePath = `${this.proxyBasePath}/admin/lockers/issues`;

    // ============================================================
    // LOCATION DIGESTS
    // ============================================================
    async getLocationDigests(): Promise<LockerLocationDigest[]> {
        try {
            const treeNodes = await this.fetchLocationsTree();
            const digests = this.extractLocationNodes(treeNodes)
                .map((item) => this.mapLocationDigest(item))
                .filter((loc): loc is LockerLocationDigest => Boolean(loc?.id));

            if (digests.length) return digests;
        } catch (error) {
            console.warn('Failed to load locations tree, fallback to admin locations list.', error);
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
            .filter((loc): loc is LockerLocationDigest => Boolean(loc?.id));
    }

    // ============================================================
    // LOCATION OVERVIEW
    // ============================================================
    async getLocationOverview(locationId: string, filters: LocationOverviewFilters = {}): Promise<LockerLocationOverview> {
        if (!locationId) throw new Error('Location id is required');

        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) searchParams.set(key, String(value));
        });

        const query = searchParams.toString();
        const [overviewResult, lockersResult, subscriptionsResult, activeReservationsResult, upcomingReservationsResult] =
            await Promise.allSettled([
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/lockers/overview${query ? `?${query}` : ''}`
                ),
                this.request<GenericApiResponse<any>>(
                    `${this.adminLocationsBasePath}/${locationId}/lockers${query ? `?${query}` : ''}`
                ),
                this.request<GenericApiResponse<any>>(`${this.adminLocationsBasePath}/${locationId}/subscriptions`),
                this.request<GenericApiResponse<any>>(`${this.adminLocationsBasePath}/${locationId}/reservations/active`),
                this.request<GenericApiResponse<any>>(`${this.adminLocationsBasePath}/${locationId}/reservations/upcoming`),
            ]);

        if (overviewResult.status !== 'fulfilled') {
            throw overviewResult.reason instanceof Error ? overviewResult.reason : new Error('Failed to load overview');
        }

        const overviewPayload = overviewResult.value;
        const overviewData = this.unwrap(overviewPayload)?.data ?? this.unwrap(overviewPayload);
        const overviewRoot = overviewData?.data ?? overviewData ?? {};
        const locationRaw = overviewRoot?.location ?? overviewData?.location ?? null;
        const statisticsRaw = overviewRoot?.statistics ?? overviewData?.statistics ?? {};
        const lockersRaw = overviewRoot?.lockers ?? overviewRoot?.data ?? [];

        const lockersResponse = lockersResult.status === 'fulfilled' ? this.unwrap(lockersResult.value) : null;
        const lockersList = Array.isArray(lockersResponse?.data)
            ? lockersResponse.data
            : Array.isArray(lockersResponse)
                ? lockersResponse
                : [];

        const subscriptionsRaw = this.extractArray(subscriptionsResult.status === 'fulfilled' ? subscriptionsResult.value : null);
        const activeReservationsRaw = this.extractArray(activeReservationsResult.status === 'fulfilled' ? activeReservationsResult.value : null);
        const upcomingReservationsRaw = this.extractArray(upcomingReservationsResult.status === 'fulfilled' ? upcomingReservationsResult.value : null);

        const location = locationRaw
            ? {
                id: String(locationRaw.id ?? locationId),
                name: locationRaw.name ?? locationRaw.title ?? 'Unknown Location',
                address: locationRaw.address ?? null,
                latitude: locationRaw.latitude ?? locationRaw.lat ?? null,
                longitude: locationRaw.longitude ?? locationRaw.lng ?? null,
            }
            : null;

        const statistics = {
            totalLockers: this.normalizeNumber(statisticsRaw?.totalLockers, lockersList.length || lockersRaw?.length || 0),
            availableLockers: this.normalizeNumber(statisticsRaw?.availableLockers),
            occupiedLockers: this.normalizeNumber(statisticsRaw?.occupiedLockers),
            maintenanceLockers: this.normalizeNumber(statisticsRaw?.maintenanceLockers ?? statisticsRaw?.maintenanceLockersCount),
        };

        const lockersSource = Array.isArray(lockersRaw) && lockersRaw.length ? lockersRaw : lockersList;
        const lockers = Array.isArray(lockersSource) ? lockersSource.map((locker) => this.mapLockerDetails(locker)) : [];

        const subscriptions: LockerSubscriptionDigest[] = subscriptionsRaw.map((item) => ({
            id: String(item.id ?? item.subscriptionId ?? ''),
            name: item.name ?? item.planName ?? item.subscriptionName ?? item.code ?? undefined,
            ownerName: item.ownerName ?? item.owner ?? item.userName ?? item.accountOwner,
            lockerCount: this.normalizeNumber(item.lockerCount ?? item.totalLockers ?? item.lockersCount),
            activeReservations: this.normalizeNumber(item.activeReservations ?? item.reservationCount),
            status: item.status ?? item.subscriptionStatus ?? item.state,
        }));

        const mergeReservations = [...activeReservationsRaw, ...upcomingReservationsRaw];
        const upcomingKeys = new Set(
            upcomingReservationsRaw.map((r) =>
                String(r.id ?? r.reservationId ?? `${r.lockerId ?? ''}-${r.reservedFrom ?? r.startTime ?? ''}`)
            )
        );

        const reservationsMap = new Map<string, LockerReservation>();
        for (const item of mergeReservations) {
            const key = String(item.id ?? item.reservationId ?? `${item.lockerId ?? ''}-${item.reservedFrom ?? ''}`);
            const isUpcoming = upcomingKeys.has(key);
            const status = this.normalizeReservationStatus(item.status ?? item.reservationStatus, isUpcoming ? 'SCHEDULED' : 'ACTIVE');

            reservationsMap.set(key, {
                id: String(item.id ?? key),
                userId: Number(item.userId ?? item.user?.id ?? 0),
                userName: item.userName ?? item.user?.name ?? 'Unknown user',
                lockerId: String(item.lockerId ?? ''),
                lockerNumber: String(item.lockerNumber ?? ''),
                lockerSize: (item.lockerSize ?? 'MEDIUM') as LockerReservation['lockerSize'],
                locationId: String(item.locationId ?? locationId),
                locationName: location?.name ?? 'Unknown',
                locationAddress: location?.address ?? undefined,
                status,
                reservationType: item.reservationType ?? item.type ?? 'GENERAL',
                orderId: item.orderId ?? undefined,
                reservedFrom: item.reservedFrom ?? '',
                reservedUntil: item.reservedUntil ?? '',
                createdAt: item.createdAt ?? new Date().toISOString(),
            });
        }

        return {
            location,
            statistics,
            lockers,
            reservations: Array.from(reservationsMap.values()),
            subscriptions,
        };
    }

    // ============================================================
    // ISSUES / MAINTENANCE
    // ============================================================
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
            issues: Array.isArray(issuesRaw) ? issuesRaw.map((i) => this.mapLockerIssue(i)) : [],
            maintenanceRecords: Array.isArray(maintenanceRaw)
                ? maintenanceRaw.map((r) => this.mapMaintenanceRecord(r))
                : [],
        };
    }

    async createLocker(payload: CreateLockerPayload): Promise<LockerDetails> {
        const res = await this.request<GenericApiResponse<any>>(this.adminLockersBasePath, {
            method: 'POST',
            body: payload,
        });
        const data = res.response ?? res.data ?? res;
        return this.mapLockerDetails(data);
    }

    async bulkCreateLockers(payload: BulkCreateLockerPayload): Promise<{ message: string }> {
        const res = await this.request<GenericApiResponse<any>>(`${this.adminLockersBasePath}/bulk`, {
            method: 'POST',
            body: payload,
        });
        return { message: res.messageText ?? 'Bulk operation completed' };
    }

    async updateLockerStatus(lockerId: string, payload: UpdateLockerStatusPayload): Promise<void> {
        await this.request(`${this.adminLockersBasePath}/${lockerId}/status`, { method: 'PUT', body: payload });
    }

    async createIssue(payload: CreateIssuePayload): Promise<LockerIssue> {
        const res = await this.request<GenericApiResponse<any>>(this.adminLockerIssuesBasePath, {
            method: 'POST',
            body: payload,
        });
        const data = res.response ?? res.data ?? res;
        return this.mapLockerIssue(data);
    }

    async updateIssue(issueId: string, payload: UpdateIssuePayload): Promise<void> {
        await this.request(`${this.issueMaintenanceBasePath}/issues/${issueId}`, { method: 'PUT', body: payload });
    }

    async addIssueComment(issueId: string, comment: { comment: string; isInternal?: boolean }): Promise<void> {
        await this.request(`${this.issueMaintenanceBasePath}/issues/${issueId}/comments`, {
            method: 'POST',
            body: comment,
        });
    }

    async scheduleMaintenance(lockerId: string, payload: ScheduleMaintenancePayload): Promise<LockerMaintenanceRecord> {
        const res = await this.request<GenericApiResponse<any>>(`${this.issueMaintenanceBasePath}/${lockerId}/maintenance`, {
            method: 'POST',
            body: { lockerId, ...payload },
        });
        const data = res.response ?? res.data ?? res;
        return this.mapMaintenanceRecord({ ...data, lockerId });
    }

    async updateMaintenance(maintenanceId: string, payload: UpdateMaintenancePayload): Promise<void> {
        await this.request(`${this.issueMaintenanceBasePath}/maintenance/${maintenanceId}`, { method: 'PATCH', body: payload });
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private unwrap<T = any>(payload: GenericApiResponse<T> | any): any {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
        return payload.response ?? payload.data ?? payload;
    }

    private normalizeReservationStatus(value: any, fallback: LockerReservation['status'] = 'ACTIVE'): LockerReservation['status'] {
        const normalized = String(value ?? '').toUpperCase();
        const allowed: LockerReservation['status'][] = ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'SCHEDULED'];
        return allowed.includes(normalized as LockerReservation['status'])
            ? (normalized as LockerReservation['status'])
            : fallback;
    }

    private normalizeNumber(value: any, fallback = 0): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    private extractArray(payload: GenericApiResponse<any> | any): any[] {
        const data = this.unwrap(payload);
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.response)) return data.response;
        return [];
    }

    // ============================================================
    // NETWORK + TOKEN LOGIC
    // ============================================================
    private async fetchLocationsTree(): Promise<any[]> {
        const headers: HeadersInit = { Accept: 'application/json' };
        const token = this.resolveToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(this.buildUrl(this.locationsTreeEndpoint), { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(res.statusText);

        const payload = await res.json().catch(() => null);
        if (!payload) return [];

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.response)) return payload.response;
        return [];
    }

    private async request<T>(path: string, init?: { method?: RequestMethod; body?: any }): Promise<T> {
        const headers: HeadersInit = { Accept: 'application/json' };
        if (init?.body !== undefined && init?.body !== null) headers['Content-Type'] = 'application/json';

        const token = this.resolveToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(this.buildUrl(path), {
            method: init?.method ?? 'GET',
            headers,
            body: init?.body ? JSON.stringify(init.body) : undefined,
            cache: 'no-store',
        });

        const text = await res.text();
        let data: any = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        if (!res.ok || data?.success === false) {
            throw new Error(data?.messageText ?? data?.message ?? res.statusText);
        }

        return data as T;
    }

    // ✅ Fixed buildUrl to ensure browser uses proxy path
    private buildUrl(path: string): string {
        if (!path) return this.baseUrl || '';
        if (this.isAbsoluteUrl(path)) return path;

        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        if (normalizedPath.startsWith('/api/v1')) return normalizedPath; // route via Next.js proxy

        return this.baseUrl ? `${this.baseUrl}${normalizedPath}` : normalizedPath;
    }

    private isAbsoluteUrl(url: string): boolean {
        return /^https?:\/\//i.test(url);
    }

    private resolveToken(): string | null {
        if (typeof window === 'undefined') return null;
        return (
            localStorage.getItem('auth_token') ||
            localStorage.getItem('auth-token') ||
            localStorage.getItem('token') ||
            null
        );
    }

    // ============================================================
    // MAP HELPERS
    // ============================================================
    private extractLocationNodes(nodes: any[]): any[] {
        const stack = Array.isArray(nodes) ? [...nodes] : [];
        const result: any[] = [];
        while (stack.length) {
            const node = stack.shift();
            if (!node) continue;
            if (String(node.type ?? '').toUpperCase() === 'LOCATION') result.push(node);
            const children = Array.isArray(node.children) ? node.children : [];
            stack.push(...children);
        }
        return result;
    }

    private mapLocationDigest(dto: any): LockerLocationDigest | null {
        if (!dto) return null;
        const id = dto.id ?? dto.locationId ?? dto.location?.id;
        if (!id) return null;

        return {
            id: String(id),
            code: dto.code ?? dto.locationCode,
            name: dto.name ?? dto.locationName ?? dto.title ?? 'Unknown location',
            address: dto.address ?? null,
            totalLockers: this.normalizeNumber(dto.totalLockers ?? dto.lockersCount ?? dto.totalLockersCount),
            availableLockers: this.normalizeNumber(dto.availableLockers ?? dto.availableCount),
            maintenanceLockers: this.normalizeNumber(dto.maintenanceLockers ?? 0),
        };
    }

    private mapLockerSummary(dto: any): LockerSummary {
        return {
            id: String(dto.id ?? dto.lockerId ?? ''),
            code: dto.code ?? dto.lockerCode ?? '',
            lockerNumber: dto.lockerNumber ? String(dto.lockerNumber) : dto.code ?? '',
            name: dto.name ?? undefined,
            subscriptionId: dto.subscriptionId ?? dto.subscription?.id,
            locationId: String(dto.locationId ?? dto.location?.id ?? ''),
            locationName: dto.locationName ?? dto.location?.name ?? undefined,
            size: (dto.size ?? 'MEDIUM') as LockerSummary['size'],
            status: (dto.status ?? 'AVAILABLE') as LockerStatus,
            maintenanceStatus: dto.maintenanceStatus ?? undefined,
            isActive: dto.isActive ?? true,
        };
    }

    private mapLockerDetails(dto: any): LockerDetails {
        const summary = this.mapLockerSummary(dto);
        return {
            ...summary,
            description: dto.description ?? null,
            lastMaintenanceDate: dto.lastMaintenanceDate ?? null,
            nextMaintenanceDue: dto.nextMaintenanceDue ?? null,
            // ✅ Added to satisfy LockerDetails type
            activeReservations: Array.isArray(dto.activeReservations)
                ? dto.activeReservations
                : [],
            maintenanceHistory: Array.isArray(dto.maintenanceHistory)
                ? dto.maintenanceHistory.map((r: any) => this.mapMaintenanceRecord(r))
                : [],
            issueReports: Array.isArray(dto.issueReports)
                ? dto.issueReports.map((i: any) => this.mapLockerIssue(i))
                : [],
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
            description: dto.description ?? dto.details ?? '',
            reportedBy: dto.reportedBy ?? dto.createdBy ?? 'system',
            reportedAt: dto.reportedAt ?? dto.createdAt ?? new Date().toISOString(),
        };
    }

    private mapMaintenanceRecord(dto: any): LockerMaintenanceRecord {
        return {
            id: String(dto.id ?? ''),
            lockerId: String(dto.lockerId ?? dto.locker?.id ?? ''),
            maintenanceType: (dto.maintenanceType ?? 'PREVENTIVE').toUpperCase() as LockerMaintenanceRecord['maintenanceType'],
            status: (dto.status ?? 'SCHEDULED').toUpperCase() as LockerMaintenanceRecord['status'],
            scheduledDate: dto.scheduledDate ?? dto.startDate ?? new Date().toISOString(),
            completedAt: dto.completedAt ?? dto.endDate ?? null,
            assignedTo: dto.assignedTo ?? dto.assignee ?? 'Unassigned',
            estimatedDurationHours: Number(dto.estimatedDurationHours ?? dto.estimatedDuration ?? 0),
            createdAt: dto.createdAt ?? new Date().toISOString(),
        };
    }

}

export const lockerOperationsService = new LockerOperationsService();
