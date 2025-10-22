import {
    LockerIssue,
    LockerIssueStatus,
    LockerMaintenanceRecord,
    LockerSummary,
    ResolveLockerIssuePayload,
    UpdateLockerIssuePayload,
} from '../../core/entities/lockers';

import type { LockerSize, LockerStatus } from '../../core/entities/lockers';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors: string[];
    timestamp: string;
}

interface PagedResult<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

interface LockerLocationDto {
    id: string;
    code?: string | null;
    name: string;
}

interface LockerSummaryAdminDto {
    id: string;
    code: string;
    name: string;
    location: LockerLocationDto;
    subscriptionId: string;
    size: LockerSize;
    status: LockerStatus;
    maxCapacity: number;
    availableCapacity: number;
    isActive: boolean;
    maintenanceStatus: string;
    activeReservationsCount: number;
    openIssuesCount: number;
}

interface LockerIssueDto extends LockerIssue {}

interface MaintenanceRecordDto extends LockerMaintenanceRecord {}

export interface OutOfServiceLockersResponse {
    lockers: LockerSummary[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

export interface LockerIssueFilters {
    status?: LockerIssueStatus;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    issueType?: string;
}

class LockerSupportService {
    private readonly baseUrl = '/admin/lockers';

    private resolveToken(explicitToken?: string): string | null {
        if (explicitToken) {
            return explicitToken;
        }
        if (typeof window === 'undefined') {
            return null;
        }
        return (
            localStorage.getItem('auth-token') ||
            localStorage.getItem('auth_token') ||
            null
        );
    }

    private getHeaders(token?: string): HeadersInit {
        const resolvedToken = this.resolveToken(token);
        const headers: HeadersInit = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
        if (resolvedToken) {
            headers['Authorization'] = `Bearer ${resolvedToken}`;
        }
        return headers;
    }

    private async request<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
        const response = await fetch(url, init);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Support service request failed (${response.status} ${response.statusText}): ${errorText || 'No response body'}`
            );
        }
        return (await response.json()) as ApiResponse<T>;
    }

    private mapLockerSummary(dto: LockerSummaryAdminDto): LockerSummary {
        return {
            id: dto.id,
            code: dto.code,
            lockerNumber: dto.name,
            subscriptionId: dto.subscriptionId,
            locationId: dto.location?.id ?? '',
            locationName: dto.location?.name,
            size: dto.size,
            status: dto.status,
            maxCapacity: dto.maxCapacity,
            availableCapacity: dto.availableCapacity,
            isActive: dto.isActive,
        };
    }

    private mapIssue(dto: LockerIssueDto): LockerIssue {
        return {
            ...dto,
            attachments: dto.attachments ?? [],
            commentsCount: dto.commentsCount ?? 0,
            statusHistory: dto.statusHistory ?? [],
        };
    }

    private mapMaintenance(record: MaintenanceRecordDto): LockerMaintenanceRecord {
        return {
            ...record,
            tasks: record.tasks ?? [],
            completedTasks: record.completedTasks ?? [],
            partsUsed: record.partsUsed ?? [],
        };
    }

    async listOutOfServiceLockers(
        params: { locationId?: string; page?: number; size?: number } = {},
        token?: string
    ): Promise<ApiResponse<OutOfServiceLockersResponse>> {
        const searchParams = new URLSearchParams();
        searchParams.set('status', 'OUT_OF_SERVICE');
        if (params.locationId) {
            searchParams.set('locationId', params.locationId);
        }
        searchParams.set('page', String(params.page ?? 0));
        searchParams.set('size', String(params.size ?? 20));

        const response = await this.request<PagedResult<LockerSummaryAdminDto>>(
            `${this.baseUrl}?${searchParams.toString()}`,
            {
                method: 'GET',
                headers: this.getHeaders(token),
            }
        );

        const lockers = response.data.content.map((item) => this.mapLockerSummary(item));

        return {
            ...response,
            data: {
                lockers,
                totalElements: response.data.totalElements,
                totalPages: response.data.totalPages,
                page: response.data.number,
                size: response.data.size,
            },
        };
    }

    async getLockerIssues(
        lockerId: string,
        filters: LockerIssueFilters = {},
        token?: string
    ): Promise<ApiResponse<LockerIssue[]>> {
        const searchParams = new URLSearchParams();
        if (filters.status) {
            searchParams.set('status', filters.status);
        }
        if (filters.severity) {
            searchParams.set('severity', filters.severity);
        }
        if (filters.issueType) {
            searchParams.set('issueType', filters.issueType);
        }

        const url = `${this.baseUrl}/${lockerId}/issues${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const response = await this.request<LockerIssueDto[]>(url, {
            method: 'GET',
            headers: this.getHeaders(token),
        });

        return {
            ...response,
            data: response.data.map((issue) => this.mapIssue(issue)),
        };
    }

    async updateIssue(
        issueId: string,
        payload: UpdateLockerIssuePayload,
        token?: string
    ): Promise<ApiResponse<LockerIssue>> {
        const response = await this.request<LockerIssueDto>(`${this.baseUrl}/issues/${issueId}`, {
            method: 'PATCH',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        return {
            ...response,
            data: this.mapIssue(response.data),
        };
    }

    async resolveIssue(
        issueId: string,
        payload: ResolveLockerIssuePayload,
        token?: string
    ): Promise<ApiResponse<Record<string, unknown>>> {
        return this.request<Record<string, unknown>>(`${this.baseUrl}/issues/${issueId}/resolve`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });
    }

    async getMaintenanceHistory(lockerId: string, token?: string): Promise<ApiResponse<LockerMaintenanceRecord[]>> {
        const response = await this.request<MaintenanceRecordDto[]>(`${this.baseUrl}/${lockerId}/maintenance/history`, {
            method: 'GET',
            headers: this.getHeaders(token),
        });

        return {
            ...response,
            data: response.data.map((record) => this.mapMaintenance(record)),
        };
    }
}

export const lockerSupportService = new LockerSupportService();
