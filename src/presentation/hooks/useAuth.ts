// Authentication Hook - WITH MOCK DATA SUPPORT
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../../core/entities';
import { useAuthStore } from '../contexts/auth-store';
import { MockAuthService } from '../../infrastructure/api/mock-auth.service';

// Toggle this to switch between mock and real API
const USE_MOCK_API = true;

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    user: User;
    token: string;
}

export function useAuth() {
    const router = useRouter();
    const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async (credentials: LoginCredentials) => {
        setLoading(true);
        setError(null);

        try {
            let response: LoginResponse;

            if (USE_MOCK_API) {
                // Use mock authentication
                response = await MockAuthService.login(
                    credentials.email,
                    credentials.password
                );
            } else {
                // Use real API (when backend is ready)
                // const apiClient = await import('../../infrastructure/api/client');
                // response = await apiClient.apiClient.post<LoginResponse>('/auth/login', credentials);
                throw new Error('Real API not configured yet');
            }

            // Store auth data
            setAuth(response.user, response.token);

            // Redirect to dashboard
            router.push('/dashboard');

            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Login failed. Please try again.';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);

        try {
            if (USE_MOCK_API) {
                await MockAuthService.logout();
            } else {
                // await apiClient.post('/auth/logout');
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            clearAuth();
            router.push('/login');
            setLoading(false);
        }
    };

    const register = async (userData: Partial<User> & { password: string }) => {
        setLoading(true);
        setError(null);

        try {
            // For now, just throw an error as registration is not implemented
            throw new Error('Registration is not available in mock mode');
        } catch (err: any) {
            const errorMessage = err.message || 'Registration failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        setLoading(true);
        setError(null);

        try {
            // Mock password reset
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        } catch (err: any) {
            const errorMessage = err.message || 'Password reset failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        register,
        resetPassword,
    };
}