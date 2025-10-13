'use client';

import { Users, Store, Package, Lock, TrendingUp, TrendingDown } from 'lucide-react';
import {useAuthStore} from "../../presentation/contexts/auth-store";

const stats = [
    {
        title: 'Total Users',
        value: '2,543',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        color: 'bg-blue-500',
    },
    {
        title: 'Providers',
        value: '189',
        change: '+8.2%',
        trend: 'up',
        icon: Store,
        color: 'bg-green-500',
    },
    {
        title: 'Products',
        value: '1,247',
        change: '+23.1%',
        trend: 'up',
        icon: Package,
        color: 'bg-purple-500',
    },
    {
        title: 'Active Lockers',
        value: '67',
        change: '-2.4%',
        trend: 'down',
        icon: Lock,
        color: 'bg-orange-500',
    },
];

const recentActivity = [
    { id: 1, user: 'John Doe', action: 'Created new product', time: '5 minutes ago' },
    { id: 2, user: 'Sarah Smith', action: 'Updated provider details', time: '15 minutes ago' },
    { id: 3, user: 'Mike Johnson', action: 'Added new locker location', time: '1 hour ago' },
    { id: 4, user: 'Emma Wilson', action: 'Approved new user', time: '2 hours ago' },
    { id: 5, user: 'David Brown', action: 'Modified product pricing', time: '3 hours ago' },
];

export default function DashboardPage() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user?.name || 'Admin'}!
                </h1>
                <p className="text-gray-600 mt-2">
                    Here's what's happening with your platform today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;

                    return (
                        <div
                            key={stat.title}
                            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div
                                    className={`flex items-center gap-1 text-sm font-medium ${
                                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}
                                >
                                    <TrendIcon className="w-4 h-4" />
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-gray-600 text-sm font-medium mb-1">
                                {stat.title}
                            </h3>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Recent Activity
                </h2>
                <div className="space-y-4">
                    {recentActivity.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {activity.user.charAt(0)}
                  </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {activity.user}
                                    </p>
                                    <p className="text-sm text-gray-600">{activity.action}</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left">
                    <Users className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Add New User</h3>
                    <p className="text-sm text-gray-600">
                        Create a new user account
                    </p>
                </button>
                <button className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left">
                    <Package className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Add Product</h3>
                    <p className="text-sm text-gray-600">
                        Add a new product to catalog
                    </p>
                </button>
                <button className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left">
                    <Lock className="w-8 h-8 text-orange-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Add Locker</h3>
                    <p className="text-sm text-gray-600">
                        Register a new locker location
                    </p>
                </button>
            </div>
        </div>
    );
}