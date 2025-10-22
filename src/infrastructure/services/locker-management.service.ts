// src/infrastructure/services/locker-management.service.ts
// Abstraction layer for locker locations, availability and reservations APIs.

import {
    FamilyCalendarResponse,
    LockerAccessValidationResult,
    LockerAvailabilityRequest,
    LockerAvailabilityResult,
    LockerLocation,
    LockerLocationStats,
    LockerLocationTreeNode,
    LockerLocationWithLockers,
    LockerSize,
    LockerReservation,
    LockerReservationActionResponse,
    LockerReservationRequest,
    LockerSummary,
} from '../../core/entities/lockers';

interface LockerApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors: string[];
    timestamp: string;
}

interface LockerPagedData<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first?: boolean;
    last?: boolean;
}

type LockerPagedResponse<T> = LockerApiResponse<LockerPagedData<T>>;

interface AvailableLockerDto {
    id: string;
    code: string;
    name?: string;
    size: LockerSize;
    maxCapacity?: number;
    availableCapacity?: number;
    availableTimeSlots?: Array<{
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }>;
    nextAvailableFrom?: string | null;
    isCurrentlyAvailable?: boolean;
    locationId?: string;
    locationName?: string;
    subscriptionId?: string;
}

const FALLBACK_LOCATIONS: LockerLocation[] = [
    {
        id: '750e8400-e29b-41d4-a716-446655440020',
        code: 'LOC-001',
        name: 'Medical City Hub',
        address: 'Amman - Medical City Street, Building 12',
        city: 'Amman',
        coordinates: { latitude: 31.9539, longitude: 35.9106 },
        operatingHours: {
            monday: '06:00-22:00',
            tuesday: '06:00-22:00',
            wednesday: '06:00-22:00',
            thursday: '06:00-22:00',
            friday: '08:00-20:00',
            saturday: '08:00-20:00',
            sunday: '08:00-20:00',
        },
        features: ['24/7 Access', 'Climate Controlled', 'Security Cameras', 'Mobile App Access'],
        availableLockerSizes: ['SMALL', 'MEDIUM', 'LARGE'],
        totalLockers: 50,
        availableLockers: 28,
        status: 'ACTIVE',
        createdAt: '2024-01-15T10:00:00',
    },
    {
        id: '750e8400-e29b-41d4-a716-446655440021',
        code: 'LOC-002',
        name: 'Downtown Center',
        address: 'Amman - Rainbow Street, Near Jabal Amman',
        city: 'Amman',
        coordinates: { latitude: 31.9515, longitude: 35.9239 },
        operatingHours: {
            monday: '08:00-20:00',
            tuesday: '08:00-20:00',
            wednesday: '08:00-20:00',
            thursday: '08:00-20:00',
            friday: '10:00-18:00',
            saturday: '10:00-18:00',
            sunday: 'Closed',
        },
        features: ['Climate Controlled', 'Security Cameras', 'Parking Available'],
        availableLockerSizes: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'],
        totalLockers: 100,
        availableLockers: 62,
        status: 'ACTIVE',
        createdAt: '2024-02-01T10:00:00',
    },
];

const FALLBACK_LOCKERS: LockerSummary[] = [
    {
        id: '850e8400-e29b-41d4-a716-446655440100',
        code: 'LOC-001-SUB-001-0012',
        lockerNumber: '0012',
        subscriptionId: '650e8400-e29b-41d4-a716-446655440010',
        locationId: '750e8400-e29b-41d4-a716-446655440020',
        locationName: 'Medical City Hub',
        size: 'MEDIUM',
        status: 'AVAILABLE',
        dimensions: { width: 40, height: 40, depth: 50, unit: 'cm' },
        features: ['Climate Control', 'Fragile Item Support', 'QR Access'],
        currentReservation: null,
        nextAvailableFrom: null,
        isActive: true,
    },
    {
        id: '850e8400-e29b-41d4-a716-446655440101',
        code: 'LOC-001-SUB-001-0015',
        lockerNumber: '0015',
        subscriptionId: '650e8400-e29b-41d4-a716-446655440010',
        locationId: '750e8400-e29b-41d4-a716-446655440020',
        locationName: 'Medical City Hub',
        size: 'LARGE',
        status: 'AVAILABLE',
        dimensions: { width: 60, height: 60, depth: 60, unit: 'cm' },
        features: ['Climate Control', 'Large Item Support', 'QR Access'],
        currentReservation: null,
        nextAvailableFrom: null,
        isActive: true,
    },
];

const FALLBACK_LOCATION_TREE: LockerLocationWithLockers[] = FALLBACK_LOCATIONS.map((location) => {
    const lockers = FALLBACK_LOCKERS.filter((locker) => locker.locationId === location.id);
    return {
        location,
        lockers: lockers.length ? lockers : FALLBACK_LOCKERS,
        totalLockers: location.totalLockers,
        availableLockers: location.availableLockers,
        maintenanceCount: 0,
        issueCount: 0,
    };
});

class LockerManagementService {
    private readonly adminBaseUrl = '/api/v1/admin';
    private readonly baseUrl = `${this.adminBaseUrl}/lockers`;
    private readonly locationsUrl = `${this.baseUrl}/locations`;
    private readonly calendarUrl = '/api/v1/family-calendar';

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

    private mapStatsToLocation(stats: LockerLocationStats): LockerLocation {
        const city = stats.address?.split('-')[0]?.trim() || 'Unknown';
        return {
            id: stats.id,
            code: stats.code,
            name: stats.name,
            address: stats.address ?? 'Address not available',
            city,
            coordinates:
                typeof stats.latitude === 'number' && typeof stats.longitude === 'number'
                    ? { latitude: stats.latitude, longitude: stats.longitude }
                    : undefined,
            operatingHours: undefined,
            features: undefined,
            availableLockerSizes: undefined,
            totalLockers: stats.totalLockers ?? 0,
            availableLockers: stats.availableLockers ?? 0,
            status: stats.isActive ? 'ACTIVE' : 'INACTIVE',
            createdAt: undefined,
        };
    }

    private async fetchWithAlternatives<T>(endpoints: string[], token?: string): Promise<LockerApiResponse<T>> {
        const errors: unknown[] = [];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    cache: 'no-store',
                    headers: this.getHeaders(token),
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    const message = payload?.message || `HTTP error! status: ${response.status}`;
                    throw new Error(message);
                }

                return await response.json();
            } catch (error) {
                errors.push(error);
            }
        }

        throw errors[errors.length - 1] ?? new Error('No endpoints available');
    }

    async getLocations(token?: string): Promise<LockerApiResponse<LockerLocation[]>> {
        try {
            const response = await this.fetchWithAlternatives<LockerLocationStats[]>(
                [
                    `${this.locationsUrl}/stats`,
                    `${this.locationsUrl}`,
                    `${this.locationsUrl}/list`,
                ],
                token
            );

            return {
                ...response,
                data: (response.data ?? []).map((stats) => this.mapStatsToLocation(stats)),
            };
        } catch (error) {
            console.warn('Failed to fetch locker locations. Using fallback data.', error);
            return {
                success: true,
                data: FALLBACK_LOCATIONS,
                message: 'Showing fallback locker locations',
                errors: ['FALLBACK_DATA'],
                timestamp: new Date().toISOString(),
            };
        }
    }

    async getLocationsHierarchy(token?: string): Promise<LockerApiResponse<LockerLocationWithLockers[]>> {
        try {
            const [treeResponse, locationsResponse] = await Promise.all([
                this.fetchWithAlternatives<LockerLocationTreeNode[]>(
                    [
                        `${this.locationsUrl}/tree`,
                        `${this.baseUrl}/locations/tree`,
                    ],
                    token
                ),
                this.getLocations(token),
            ]);

            const locationIndex = new Map<string, LockerLocation>();
            (locationsResponse.data ?? []).forEach((location) => {
                locationIndex.set(location.id, location);
            });

            const aggregatedErrors = new Set<string>();
            (treeResponse.errors ?? []).forEach((error) => error && aggregatedErrors.add(error));
            (locationsResponse.errors ?? []).forEach((error) => error && aggregatedErrors.add(error));

            const hierarchyData = await Promise.all(
                (treeResponse.data ?? [])
                    .filter((node) => node.type === 'LOCATION')
                    .map(async (locationNode) => {
                        const lockersResponse = await this.getLockersByLocation(locationNode.id, token);
                        (lockersResponse.errors ?? []).forEach((error) => error && aggregatedErrors.add(error));

                        const lockers = lockersResponse.data ?? [];
                        const baseLocation = locationIndex.get(locationNode.id);
                        const location = baseLocation
                            ? { ...baseLocation }
                            : {
                                id: locationNode.id,
                                code: locationNode.code,
                                name: locationNode.name,
                                address: 'Address not available',
                                city: 'Unknown',
                                totalLockers: locationNode.lockerCount,
                                availableLockers: locationNode.availableLockerCount,
                                status: 'ACTIVE',
                            };

                        return {
                            location,
                            lockers,
                            totalLockers:
                                lockers.length || location.totalLockers || locationNode.lockerCount,
                            availableLockers:
                                lockers.length
                                    ? lockers.filter((locker) => locker.status === 'AVAILABLE').length
                                    : location.availableLockers || locationNode.availableLockerCount,
                            maintenanceCount: lockers.filter((locker) => locker.status === 'MAINTENANCE').length,
                            issueCount: 0,
                        } satisfies LockerLocationWithLockers;
                    })
            );

            return {
                success: true,
                data: hierarchyData,
                message: treeResponse.message || 'Location tree loaded successfully',
                errors: Array.from(aggregatedErrors),
                timestamp: new Date().toISOString(),
            };
        } catch (primaryError) {
            console.warn('Failed to fetch location locker hierarchy from dedicated endpoint. Attempting manual aggregation.', primaryError);
            try {
                const locationsResponse = await this.getLocations(token);
                if (!locationsResponse.data?.length) {
                    throw new Error('No locations returned for hierarchy aggregation');
                }

                const aggregatedErrors = new Set<string>();

                const lockersByLocation = await Promise.all(
                    locationsResponse.data.map(async (location) => {
                        const lockersResponse = await this.getLockersByLocation(location.id, token);

                        lockersResponse.errors?.forEach((error) => {
                            if (error) {
                                aggregatedErrors.add(error);
                            }
                        });

                        return {
                            location,
                            lockers: lockersResponse.data,
                            totalLockers: lockersResponse.data.length,
                            availableLockers: lockersResponse.data.filter((locker) => locker.status === 'AVAILABLE').length,
                            maintenanceCount: lockersResponse.data.filter((locker) => locker.status === 'MAINTENANCE').length,
                            issueCount: 0,
                        } satisfies LockerLocationWithLockers;
                    })
                );

                return {
                    success: true,
                    data: lockersByLocation,
                    message: 'Locations hierarchy constructed from locker listings',
                    errors: Array.from(aggregatedErrors),
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                console.warn('Failed to aggregate location hierarchy. Using fallback data.', error);
                return {
                    success: true,
                    data: FALLBACK_LOCATION_TREE,
                    message: 'Showing fallback location hierarchy',
                    errors: ['FALLBACK_DATA'],
                    timestamp: new Date().toISOString(),
                };
            }
        }
    }

    async getLockersByLocation(locationId: string, token?: string): Promise<LockerApiResponse<LockerSummary[]>> {
        try {
            const candidateEndpoints = [
                `${this.locationsUrl}/${locationId}/lockers`,
                `${this.adminBaseUrl}/locations/${locationId}/lockers`,
            ];

            for (const endpoint of candidateEndpoints) {
                const response = await fetch(endpoint, {
                    cache: 'no-store',
                    headers: this.getHeaders(token),
                });

                if (response.ok) {
                    return await response.json();
                }

                console.warn(`Locker lookup endpoint ${endpoint} failed with status ${response.status}.`);
            }

            const params = new URLSearchParams({ locationId, page: '0', sort: 'lockerNumber,asc' });
            const secondaryResponse = await fetch(`${this.baseUrl}?${params.toString()}`, {
                cache: 'no-store',
                headers: this.getHeaders(token),
            });

            if (!secondaryResponse.ok) {
                throw new Error(`HTTP error! status: ${secondaryResponse.status}`);
            }

            const payload: LockerPagedResponse<LockerSummary> = await secondaryResponse.json();
            return {
                success: payload.success,
                data: payload.data?.content ?? [],
                message: payload.message,
                errors: payload.errors,
                timestamp: payload.timestamp,
            };
        } catch (error) {
            console.warn('Failed to fetch lockers for location. Using fallback data.', error);
            const filtered = FALLBACK_LOCKERS.filter((locker) => locker.locationId === locationId);
            return {
                success: true,
                data: filtered.length ? filtered : FALLBACK_LOCKERS,
                message: 'Showing fallback lockers for location',
                errors: ['FALLBACK_DATA'],
                timestamp: new Date().toISOString(),
            };
        }
    }

    async getActiveSubscriptionsForUser(userId: number, token?: string) {
        const response = await fetch(`${this.baseUrl}/users/${userId}/active-subscriptions`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error(`Failed to load active subscriptions: ${response.status}`);
        }

        return response.json();
    }

    async getAccessibleLocations(userId: number, token?: string) {
        const response = await fetch(`${this.baseUrl}/users/${userId}/accessible-locations`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });
        if (!response.ok) {
            throw new Error(`Failed to load accessible locations: ${response.status}`);
        }
        return response.json();
    }

    async getAccessibleLockers(userId: number, token?: string) {
        const response = await fetch(`${this.baseUrl}/users/${userId}/accessible-lockers`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });
        if (!response.ok) {
            throw new Error(`Failed to load accessible lockers: ${response.status}`);
        }
        return response.json();
    }

    async getAvailableLockersForUser(
        userId: number | null | undefined,
        locationId: string,
        token?: string,
        filters?: {
            size?: LockerSize;
            startTime?: string;
            endTime?: string;
            scope?: 'SPECIFIC_USER' | 'ALL_USERS';
        }
    ): Promise<LockerApiResponse<LockerSummary[]>> {
        const params = new URLSearchParams();
        if (filters?.size) {
            params.set('size', filters.size);
        }
        if (filters?.startTime) {
            params.set('startTime', filters.startTime);
        }
        if (filters?.endTime) {
            params.set('endTime', filters.endTime);
        }
        if (filters?.scope) {
            params.set('scope', filters.scope);
        }
        if (typeof userId === 'number' && !Number.isNaN(userId)) {
            params.set('userId', String(userId));
        }

        const endpoint = `${this.locationsUrl}/${locationId}/available-lockers${
            params.toString() ? `?${params.toString()}` : ''
        }`;

        try {
            const response = await fetch(endpoint, {
                cache: 'no-store',
                headers: this.getHeaders(token),
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.message || `Failed to load available lockers: ${response.status}`);
            }

            const payload: LockerApiResponse<AvailableLockerDto[]> = await response.json();
            return {
                ...payload,
                data: (payload.data ?? []).map((locker) => ({
                    id: locker.id,
                    code: locker.code,
                    lockerNumber: locker.name ?? locker.code,
                    subscriptionId: locker.subscriptionId,
                    locationId: locker.locationId ?? locationId,
                    locationName: locker.locationName,
                    size: locker.size,
                    status: locker.isCurrentlyAvailable === false ? 'OCCUPIED' : 'AVAILABLE',
                    maxCapacity: locker.maxCapacity,
                    availableCapacity: locker.availableCapacity,
                    availableTimeSlots: locker.availableTimeSlots,
                    nextAvailableFrom: locker.nextAvailableFrom ?? null,
                    isCurrentlyAvailable: locker.isCurrentlyAvailable ?? true,
                })),
            };
        } catch (error) {
            console.warn('Failed to fetch available lockers. Using fallback data.', error);
            const lockers = FALLBACK_LOCKERS.filter((locker) => locker.locationId === locationId);
            return {
                success: true,
                data: lockers.length ? lockers : FALLBACK_LOCKERS,
                message: 'Showing fallback available lockers',
                errors: ['FALLBACK_DATA'],
                timestamp: new Date().toISOString(),
            };
        }
    }

    async checkLockerAvailability(payload: LockerAvailabilityRequest, token?: string): Promise<LockerApiResponse<LockerAvailabilityResult>> {
        const response = await fetch(`${this.baseUrl}/availability/check`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to check locker availability');
        }

        return response.json();
    }

    async reserveLocker(payload: LockerReservationRequest, token?: string) {
        const response = await fetch(`${this.baseUrl}/reservations`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to reserve locker');
        }

        return response.json();
    }

    async getReservation(reservationId: string, token?: string): Promise<LockerApiResponse<LockerReservation>> {
        const response = await fetch(`${this.baseUrl}/reservations/${reservationId}`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error(`Failed to load reservation: ${response.status}`);
        }

        return response.json();
    }

    async getReservationsForUser(userId: number, status?: string, token?: string): Promise<LockerApiResponse<LockerReservation[]>> {
        const params = new URLSearchParams();
        if (status) {
            params.set('status', status);
        }
        const url = `${this.baseUrl}/users/${userId}/reservations${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error(`Failed to load reservations: ${response.status}`);
        }

        return response.json();
    }

    async completeReservation(reservationId: string, token?: string): Promise<LockerApiResponse<boolean>> {
        const response = await fetch(`${this.baseUrl}/reservations/${reservationId}/complete`, {
            method: 'PUT',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to complete reservation');
        }

        return response.json();
    }

    async cancelReservation(reservationId: string, userId: number, token?: string): Promise<LockerApiResponse<boolean>> {
        const params = new URLSearchParams({ userId: String(userId) });
        const response = await fetch(`${this.baseUrl}/reservations/${reservationId}/cancel?${params.toString()}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to cancel reservation');
        }

        return response.json();
    }

    async extendReservation(reservationId: string, userId: number, newEndTime: string, token?: string): Promise<LockerApiResponse<LockerReservationActionResponse>> {
        const params = new URLSearchParams({ userId: String(userId), newEndTime });
        const response = await fetch(`${this.baseUrl}/reservations/${reservationId}/extend?${params.toString()}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to extend reservation');
        }

        return response.json();
    }

    async validateAccessCode(lockerId: string, userId: number, accessCode: string, token?: string): Promise<LockerAccessValidationResult> {
        const params = new URLSearchParams({ lockerId, userID: String(userId), accessCode });
        const response = await fetch(`${this.baseUrl}/access/validate?${params.toString()}`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to validate access code');
        }

        return response.json();
    }

    async getFamilyCalendar(subscriptionId: string, startDate: string, endDate: string, token?: string): Promise<LockerApiResponse<FamilyCalendarResponse>> {
        const params = new URLSearchParams({ startDate, endDate });
        const response = await fetch(`${this.calendarUrl}/subscriptions/${subscriptionId}/calendar?${params.toString()}`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to load family calendar');
        }

        return response.json();
    }
}

export const lockerManagementService = new LockerManagementService();
