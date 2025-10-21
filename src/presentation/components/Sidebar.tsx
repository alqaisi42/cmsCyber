// src/presentation/components/Sidebar.tsx
// MINIMAL VERSION - No auth store usage

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
    Tag
} from 'lucide-react';
import { useState } from 'react';
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
        title: 'Orders',
        href: '/dashboard/admin/orders',
        icon: Package,
    },
    // {
    //     title: 'Users',
    //     href: '/dashboard/users',
    //     icon: Users,
    // },
    // Shop Management Section
    {
        title: 'Shop Providers',
        href: '/dashboard/shop/providers',
        icon: Store,
    },
    // {
    //     title: 'Shop Products',
    //     href: '/dashboard/shop/products',
    //     icon: Package,
    // },
    {
        title: 'Categories',
        href: '/dashboard/shop/categories',
        icon: Tag,
    },
    // Other sections
    // {
    //     title: 'Providers',
    //     href: '/dashboard/providers',
    //     icon: Store,
    // },
    // {
    //     title: 'Products',
    //     href: '/dashboard/products',
    //     icon: Package,
    // },
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

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            window.location.href = '/login';
        }
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
                    'fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-40 overflow-y-auto',
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
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                                return (
                                    <li key={item.href}>
                                        <Link
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
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-800">
                        <div className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800',
                            collapsed && 'lg:justify-center'
                        )}>
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold">A</span>
                            </div>
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">Admin User</p>
                                    <p className="text-xs text-gray-400 truncate">admin@3lababee.com</p>
                                </div>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className={cn(
                                'w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
                                collapsed && 'lg:justify-center'
                            )}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}