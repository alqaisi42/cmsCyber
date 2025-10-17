// src/presentation/contexts/auth-store.ts
// SIMPLIFIED VERSION - No complex middleware, just works

import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    initialize: () => void;
}

// Create store WITHOUT persist middleware first
export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    // Set authentication
    setAuth: (user, token) => {
        // Save to localStorage manually
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth-user', JSON.stringify(user));
            localStorage.setItem('auth-token', token);
        }

        set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
        });
    },

    // Clear authentication
    clearAuth: () => {
        // Remove from localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-user');
            localStorage.removeItem('auth-token');
        }

        set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
        });
    },

    // Initialize from localStorage
    initialize: () => {
        if (typeof window === 'undefined') {
            set({ isLoading: false });
            return;
        }

        try {
            const userStr = localStorage.getItem('auth-user');
            const token = localStorage.getItem('auth-token');

            if (userStr && token) {
                const user = JSON.parse(userStr);
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            set({ isLoading: false });
        }
    }
}));