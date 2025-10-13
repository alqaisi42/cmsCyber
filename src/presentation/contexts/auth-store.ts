// Authentication Store using Zustand - FIXED VERSION

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../../core/entities';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthActions {
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
    updateUser: (user: Partial<User>) => void;
    initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            // Actions
            setAuth: (user, token) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                }
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false
                });
            },

            clearAuth: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                }
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            },

            setLoading: (loading) => set({ isLoading: loading }),

            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),

            // Initialize after hydration
            initialize: () => {
                const state = get();
                // If we have a token, we're authenticated
                const hasAuth = !!state.token && !!state.user;
                set({
                    isAuthenticated: hasAuth,
                    isLoading: false
                });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // After rehydration, initialize the store
                state?.initialize();
            },
        }
    )
);