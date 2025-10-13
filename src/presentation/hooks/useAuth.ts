// Authentication Hook

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {User} from "../../core/entities";
import {useAuthStore} from "../contexts/auth-store";
import {apiClient} from "../../infrastructure/api/client";
import {ApiError} from "next/dist/server/api-utils";


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
            // Call your actual API endpoint
            const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

            // Store auth data
            setAuth(response.user, response.token);

            // Redirect to dashboard
            router.push('/dashboard');

            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);

        try {
            // Optional: Call logout endpoint
            await apiClient.post('/auth/logout');
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
            const response = await apiClient.post<LoginResponse>('/auth/register', userData);
            setAuth(response.user, response.token);
            router.push('/dashboard');
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/auth/reset-password', { email });
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message);
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