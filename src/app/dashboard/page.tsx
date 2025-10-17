// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Store,
    Package,
    Lock,
    TrendingUp,
    Bell,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '../../presentation/contexts/auth-store';

// Types
interface Announcement {
    id: string;
    date: string;
    title: string;
    description: string;
}

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalProviders: number;
    activeProviders: number;
    totalProducts: number;
    totalLockers: number;
    activeLockers: number;
    newUsersToday: number;
}

export default function DashboardPage() {
    const { user, clearAuth } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard data
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Mock data for now
        setStats({
            totalUsers: 847,
            activeUsers: 782,
            totalProviders: 45,
            activeProviders: 38,
            totalProducts: 1234,
            totalLockers: 23,
            activeLockers: 19,
            newUsersToday: 12
        });

        setAnnouncements([
            {
                id: '1',
                date: '2024-10-16',
                title: 'New Provider Registration',
                description: 'We have updated the providers registration process for better efficiency.'
            },
            {
                id: '2',
                date: '2024-10-15',
                title: 'System Maintenance Complete',
                description: 'The scheduled maintenance has been completed successfully.'
            }
        ]);

        setLoading(false);
    };

    const logout = () => {
        clearAuth();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-300 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">
                                3lababee Management System
                            </h1>
                            <p className="text-sm text-slate-600 mt-0.5">
                                Welcome back, {user?.name || 'User'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                <Bell className="w-5 h-5 text-slate-600" />
                            </button>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Users</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {stats?.totalUsers.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-green-600 mt-2 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {stats?.newUsersToday || 0} new today
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Active Providers */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Active Providers</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {stats?.activeProviders.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    of {stats?.totalProviders || 0} total
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Store className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Total Products */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Products</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {stats?.totalProducts.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-blue-600 mt-2">
                                    Active in marketplace
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Package className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    {/* Active Lockers */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Active Lockers</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {stats?.activeLockers.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    of {stats?.totalLockers || 0} total
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Lock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Chart Placeholder */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Platform Activity</h2>
                            <select className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg">
                                <option>Last 7 days</option>
                                <option>Last 30 days</option>
                                <option>Last 90 days</option>
                            </select>
                        </div>

                        {/* Chart placeholder */}
                        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                            <div className="text-center">
                                <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                <p className="text-slate-500">Activity chart will be displayed here</p>
                            </div>
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Announcements</h2>
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div key={announcement.id} className="pb-4 border-b border-slate-200 last:border-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900">
                                                {announcement.title}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-1">
                                                {announcement.description}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {new Date(announcement.date).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <a href="/dashboard/admin/users" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
                            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-900">Manage Users</p>
                        </a>
                        <a href="/dashboard/providers" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
                            <Store className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-900">View Providers</p>
                        </a>
                        <a href="/dashboard/products" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
                            <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-900">Browse Products</p>
                        </a>
                        <a href="/dashboard/lockers" className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-center">
                            <Lock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-900">Monitor Lockers</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}