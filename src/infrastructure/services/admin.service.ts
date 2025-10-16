// src/infrastructure/services/admin.service.ts
import { apiClient } from '../api/client';

export interface UserFilters {
    searchQuery?: string;
    role?: string;
    isActive?: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    twoFactorEnabled?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    lastLoginAfter?: string;
    lastLoginBefore?: string;
    socialProvider?: string;
    isLocked?: boolean;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    page?: number;
    size?: number;
}

export interface AdminUser {
    userId: number;
    email: string;
    name: string;
    role: string;
    phoneNumber: string;
    phoneVerified: boolean;
    emailVerified: boolean;
    isActive: boolean;
    socialProvider: string | null;
    socialId: string | null;
    profileImageUrl: string | null;
    twoFactorEnabled: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
    loginAttempts: number;
    lockedUntil: string | null;
    timezone: string | null;
    locale: string | null;
    hasFcmToken: boolean;
    emailVerificationOtpExpiresAt: string | null;
    emailVerificationAttempts: number;
}

export interface UsersResponse {
    success: boolean;
    data: {
        users: AdminUser[];
        totalElements: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        isFirst: boolean;
        isLast: boolean;
    };
    message: string;
    errors: string[];
    timestamp: string;
}

export interface UserStatistics {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    twoFactorUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
}

export interface StatisticsResponse {
    success: boolean;
    data: UserStatistics;
    message: string;
    errors: string[];
    timestamp: string;
}

class AdminUserService {
    private readonly baseUrl = '/api/v1/admin/users';

    // Update this to point to your actual backend
    private readonly apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://148.230.111.245:32080';

    async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
        const params = new URLSearchParams();

        // Add all filters to query params
        if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
        if (filters.role) params.append('role', filters.role);
        if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters.emailVerified !== undefined) params.append('emailVerified', String(filters.emailVerified));
        if (filters.phoneVerified !== undefined) params.append('phoneVerified', String(filters.phoneVerified));
        if (filters.twoFactorEnabled !== undefined) params.append('twoFactorEnabled', String(filters.twoFactorEnabled));
        if (filters.createdAfter) params.append('createdAfter', filters.createdAfter);
        if (filters.createdBefore) params.append('createdBefore', filters.createdBefore);
        if (filters.lastLoginAfter) params.append('lastLoginAfter', filters.lastLoginAfter);
        if (filters.lastLoginBefore) params.append('lastLoginBefore', filters.lastLoginBefore);
        if (filters.socialProvider) params.append('socialProvider', filters.socialProvider);
        if (filters.isLocked !== undefined) params.append('isLocked', String(filters.isLocked));
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
        if (filters.page !== undefined) params.append('page', String(filters.page));
        if (filters.size !== undefined) params.append('size', String(filters.size));

        try {
            // Direct API call to your backend
            const response = await fetch(`${this.apiUrl}${this.baseUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                    // 'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        }
    }

    async getUserStatistics(): Promise<StatisticsResponse> {
        try {
            const response = await fetch(`${this.apiUrl}${this.baseUrl}/statistics`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch user statistics:', error);
            throw error;
        }
    }

    async updateUser(userId: number, data: Partial<AdminUser>): Promise<any> {
        try {
            const response = await fetch(`${this.apiUrl}${this.baseUrl}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    async deleteUser(userId: number): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}${this.baseUrl}/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    }

    async toggleUserStatus(userId: number, isActive: boolean): Promise<any> {
        return this.updateUser(userId, { isActive });
    }

    async resetPassword(userId: number): Promise<any> {
        try {
            const response = await fetch(`${this.apiUrl}${this.baseUrl}/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to reset password:', error);
            throw error;
        }
    }

    async unlockUser(userId: number): Promise<any> {
        return this.updateUser(userId, { lockedUntil: null, loginAttempts: 0 });
    }

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    }
}

export const adminUserService = new AdminUserService();