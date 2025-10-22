// src/infrastructure/services/locker-management.service.ts
// Abstraction layer for locker locations, availability and reservations APIs.

import {
    FamilyCalendarResponse,
    LockerAccessValidationResult,
    LockerAvailabilityRequest,
    LockerAvailabilityResult,
    LockerLocation,
    LockerLocationWithLockers,
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

const FALLBACK_LOCATIONS: LockerLocation[] = [
    {
        id: 'loc-660e8400-e29b-41d4-a716-446655440001',
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
        id: 'loc-ff0e8400-e29b-41d4-a716-446655440010',
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
        id: 'locker-770e8400-e29b-41d4-a716-446655440002',
        code: 'LOC-001-SUB-001-0012',
        lockerNumber: '0012',
        subscriptionId: 'sub-550e8400-e29b-41d4-a716-446655440000',
        locationId: 'loc-660e8400-e29b-41d4-a716-446655440001',
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
        id: 'locker-dd0e8400-e29b-41d4-a716-446655440008',
        code: 'LOC-001-SUB-001-0015',
        lockerNumber: '0015',
        subscriptionId: 'sub-550e8400-e29b-41d4-a716-446655440000',
        locationId: 'loc-660e8400-e29b-41d4-a716-446655440001',
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
    private readonly baseUrl = '/api/v1/admin/lockers';
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

    async getLocations(token?: string): Promise<LockerApiResponse<LockerLocation[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/locations`, {
                cache: 'no-store',
                headers: this.getHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
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
            const response = await fetch(`${this.baseUrl}/locations/tree`, {
                cache: 'no-store',
                headers: this.getHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch location locker hierarchy. Using fallback data.', error);
            return {
                success: true,
                data: FALLBACK_LOCATION_TREE,
                message: 'Showing fallback location hierarchy',
                errors: ['FALLBACK_DATA'],
                timestamp: new Date().toISOString(),
            };
        }
    }

    async getLockersByLocation(locationId: string, token?: string): Promise<LockerApiResponse<LockerSummary[]>> {
        try {
            const params = new URLSearchParams({
                locationId,
                page: '0',
                size: '50',
                sort: 'lockerNumber,asc',
            });
            const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
                cache: 'no-store',
                headers: this.getHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const payload: LockerPagedResponse<LockerSummary> = await response.json();
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

    async getAvailableLockersForUser(userId: number, locationId: string, token?: string) {
        const response = await fetch(`${this.baseUrl}/users/${userId}/locations/${locationId}/available-lockers`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });
        if (!response.ok) {
            throw new Error(`Failed to load available lockers: ${response.status}`);
        }
        return response.json();
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
