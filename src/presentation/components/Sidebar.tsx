// src/presentation/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    UserCog,
    Package,
    Store,
    Lock,
    Settings,
    LogOut,
    Menu,
    X,
    Layers
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from "../contexts/auth-store";
import { cn } from "../../shared/utils/cn";

const navigationItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Manage Users',
        href: '/dashboard/admin/users',
        icon: UserCog,
    },
    {
        title: 'Providers',
        href: '/dashboard/providers',
        icon: Store,
    },
    {
        title: 'All Products',
        href: '/dashboard/products',
        icon: Package,
    },
    {
        title: 'Categories',
        href: '/dashboard/categories',
        icon: Layers,
    },
    {
        title: 'Customers',
        href: '/dashboard/users',
        icon: Users,
    },
    {
        title: 'Lockers',
        href: '/dashboard/lockers',
        icon: Lock,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { user, clearAuth } = useAuthStore();

    const handleLogout = () => {
        clearAuth();
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white"
            >
                {collapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-40',
                    collapsed ? 'w-0 lg:w-20' : 'w-64'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-800">
                        <h1 className={cn(
                            'font-bold text-xl transition-all',
                            collapsed ? 'lg:text-center lg:text-sm' : ''
                        )}>
                            {collapsed ? '3L' : '3lababee Admin'}
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-6 py-3 transition-colors',
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                                        collapsed && 'lg:justify-center lg:px-4'
                                    )}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="text-sm font-medium">{item.title}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="border-t border-gray-800 p-4">
                        {user && !collapsed && (
                            <div className="mb-3 px-2">
                                <p className="text-sm font-medium text-white truncate">
                                    {user.name || user.email}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className={cn(
                                'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-gray-300 hover:bg-red-600 hover:text-white w-full',
                                collapsed && 'lg:justify-center'
                            )}
                        >
                            <LogOut className="w-5 h-5" />
                            {!collapsed && <span className="text-sm font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setCollapsed(true)}
                />
            )}
        </>
    );
}