'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Package,
    Store,
    Lock,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import {useAuthStore} from "../contexts/auth-store";
import {cn} from "../../shared/utils/cn";


const navigationItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Users',
        href: '/dashboard/users',
        icon: Users,
    },
    {
        title: 'Providers',
        href: '/dashboard/providers',
        icon: Store,
    },
    {
        title: 'Products',
        href: '/dashboard/products',
        icon: Package,
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
        {collapsed ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
    {collapsed ? '3L' : '3lababee'}
    </h1>
    {!collapsed && (
        <p className="text-xs text-gray-400 mt-1">Admin Portal</p>
    )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                    <Link
                        key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                collapsed && 'lg:justify-center'
            )}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                    <span className="font-medium">{item.title}</span>
                )}
                </Link>
            );
            })}
        </nav>

    {/* User info & logout */}
    <div className="p-4 border-t border-gray-800">
        {!collapsed && user && (
        <div className="mb-3 px-4">
        <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
        </div>
)}
    <button
        onClick={handleLogout}
    className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors',
        collapsed && 'lg:justify-center'
)}
>
    <LogOut className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="font-medium">Logout</span>}
        </button>
        </div>
        </div>
        </aside>

    {/* Overlay for mobile */}
    {!collapsed && (
        <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
        onClick={() => setCollapsed(true)}
        />
    )}
    </>
);
}