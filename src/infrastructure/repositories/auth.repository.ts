
// Authentication Repository Implementation
import { IAuthRepository } from '../../core/interfaces/repositories';
import { User } from '../../core/entities';
import { apiClient } from '../api/client';

export class AuthRepository implements IAuthRepository {
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        return await apiClient.post('/auth/login', { email, password });
    }

    async logout(): Promise<void> {
        await apiClient.post('/auth/logout');
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            return await apiClient.get('/auth/me');
        } catch {
            return null;
        }
    }

    async refreshToken(): Promise<string> {
        const response = await apiClient.post<{ token: string }>('/auth/refresh');
        return response.token;
    }
}

export const authRepository = new AuthRepository();