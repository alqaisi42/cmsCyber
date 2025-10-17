// src/app/dashboard/layout.tsx
// ULTRA SAFE VERSION - Won't crash even if auth fails

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../presentation/components/Sidebar';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Wait for client-side mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check auth after mount
    useEffect(() => {
        if (!mounted) return;

        // For development, bypass auth
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            console.log('⚠️ Development mode - Auth bypassed');
            setAuthChecked(true);
            return;
        }

        // In production, check localStorage
        try {
            const token = localStorage.getItem('auth-token');
            if (!token) {
                router.push('/login');
                return;
            }
            setAuthChecked(true);
        } catch (error) {
            console.error('Auth check failed:', error);
            setAuthChecked(true);
        }
    }, [mounted, router]);

    // Show loading only if not mounted yet
    if (!mounted || !authChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">3L</span>
                    </div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-8">
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Development Mode</strong> - Auth check bypassed
                        </p>
                    </div>
                )}
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}