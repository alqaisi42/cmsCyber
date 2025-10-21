// src/infrastructure/services/locker-subscription.service.ts
// Client side abstraction over the locker subscription REST API.

import {
    AccessibleSubscription,
    CancelSubscriptionResponse,
    CreateSubscriptionRequest,
    LockerSubscription,
    LockerSubscriptionPlan,
    ShareSubscriptionRequest,
    SubscriptionUsageResponse,
    UpdateSharingRequest,
    UpgradeSubscriptionRequest,
} from '../../core/entities/locker-subscription';

interface LockerApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors: string[];
    timestamp: string;
}

const FALLBACK_PLANS: LockerSubscriptionPlan[] = [
    {
        id: 'plan-basic-001',
        planName: 'Basic 2 Lockers',
        planCode: 'BASIC_2',
        lockerCapacity: 2,
        maxConcurrentReservations: 2,
        monthlyPrice: 9.99,
        annualPrice: 99.99,
        sharingEnabled: true,
        maxSharedUsers: 5,
        description: 'Entry plan with a pair of lockers for light usage.',
        isActive: true,
    },
    {
        id: 'plan-standard-005',
        planName: 'Standard 5 Lockers',
        planCode: 'STANDARD_5',
        lockerCapacity: 5,
        maxConcurrentReservations: 4,
        monthlyPrice: 19.99,
        annualPrice: 199.99,
        sharingEnabled: true,
        maxSharedUsers: 10,
        description: 'Great for growing teams with moderate reservation needs.',
        isActive: true,
    },
    {
        id: 'plan-premium-010',
        planName: 'Premium 10 Lockers',
        planCode: 'PREMIUM_10',
        lockerCapacity: 10,
        maxConcurrentReservations: 8,
        monthlyPrice: 39.99,
        annualPrice: 399.99,
        sharingEnabled: true,
        maxSharedUsers: 15,
        description: 'High-capacity plan with additional concurrent reservations.',
        isActive: true,
    },
];

class LockerSubscriptionService {
    private readonly baseUrl = '/api/v1/locker-subscriptions';

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

    async getPlans(): Promise<LockerApiResponse<LockerSubscriptionPlan[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/plans`, {
                cache: 'no-store',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch plans from API. Falling back to static data.', error);
            return {
                success: true,
                data: FALLBACK_PLANS,
                message: 'Showing fallback subscription plans',
                errors: ['FALLBACK_DATA'],
                timestamp: new Date().toISOString(),
            };
        }
    }

    async getMySubscriptions(token?: string): Promise<LockerApiResponse<LockerSubscription[]>> {
        const response = await fetch(`${this.baseUrl}/my-subscriptions`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch subscriptions: ${response.status}`);
        }

        return response.json();
    }

    async getAccessibleSubscriptions(token?: string): Promise<LockerApiResponse<AccessibleSubscription[]>> {
        const response = await fetch(`${this.baseUrl}/accessible-subscriptions`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch accessible subscriptions: ${response.status}`);
        }

        return response.json();
    }

    async createSubscription(payload: CreateSubscriptionRequest, token?: string): Promise<LockerApiResponse<LockerSubscription>> {
        const response = await fetch(`${this.baseUrl}/create`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to create subscription');
        }

        return response.json();
    }

    async upgradeSubscription(subscriptionId: string, payload: UpgradeSubscriptionRequest, token?: string): Promise<LockerApiResponse<LockerSubscription>> {
        const response = await fetch(`${this.baseUrl}/${subscriptionId}/upgrade`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to upgrade subscription');
        }

        return response.json();
    }

    async cancelSubscription(subscriptionId: string, reason: string, token?: string): Promise<CancelSubscriptionResponse> {
        const params = new URLSearchParams({ reason });
        const response = await fetch(`${this.baseUrl}/${subscriptionId}?${params.toString()}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to cancel subscription');
        }

        return response.json();
    }

    async shareSubscription(subscriptionId: string, payload: ShareSubscriptionRequest, token?: string) {
        const response = await fetch(`${this.baseUrl}/${subscriptionId}/share`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to share subscription');
        }

        return response.json();
    }

    async getSharedUsers(subscriptionId: string, token?: string) {
        const response = await fetch(`${this.baseUrl}/${subscriptionId}/shared-users`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error(`Failed to load shared users: ${response.status}`);
        }

        return response.json();
    }

    async updateSharing(sharingId: string, payload: UpdateSharingRequest, token?: string) {
        const response = await fetch(`${this.baseUrl}/sharing/${sharingId}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to update sharing settings');
        }

        return response.json();
    }

    async revokeSharing(sharingId: string, token?: string) {
        const response = await fetch(`${this.baseUrl}/sharing/${sharingId}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to revoke sharing');
        }

        return response.json();
    }

    async acceptInvitation(invitationToken: string, token?: string) {
        const response = await fetch(`${this.baseUrl}/invitations/accept`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ invitationToken, acceptTerms: true }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to accept invitation');
        }

        return response.json();
    }

    async rejectInvitation(invitationToken: string, token?: string) {
        const params = new URLSearchParams({ invitationToken });
        const response = await fetch(`${this.baseUrl}/invitations/reject?${params.toString()}`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to reject invitation');
        }

        return response.json();
    }

    async checkAvailability(subscriptionId: string, requestedFrom: string, requestedUntil: string, token?: string) {
        const params = new URLSearchParams({ requestedFrom, requestedUntil });
        const response = await fetch(`${this.baseUrl}/${subscriptionId}/availability?${params.toString()}`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to check availability');
        }

        return response.json();
    }

    async getUsage(subscriptionId: string, token?: string): Promise<LockerApiResponse<SubscriptionUsageResponse>> {
        const response = await fetch(`${this.baseUrl}/${subscriptionId}/usage`, {
            cache: 'no-store',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Failed to load subscription usage');
        }

        return response.json();
    }
}

export const lockerSubscriptionService = new LockerSubscriptionService();
