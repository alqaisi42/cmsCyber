// src/app/dashboard/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Users, UserCheck, Shield, Activity, Calendar, TrendingUp,
    Search, Filter, Download, RefreshCw, Edit2, Trash2,
    Lock, Unlock, Mail, Phone, Globe, ChevronDown, X
} from 'lucide-react';
import { adminUserService, AdminUser, UserStatistics, UserFilters } from '../../../../infrastructure/services/admin.service';
import { formatDate } from '../../../../shared/utils/cn';

export default function AdminUsersPage() {
    // State Management
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters
    const [filters, setFilters] = useState<UserFilters>({
        searchQuery: '',
        role: '',
        isActive: undefined,
        emailVerified: undefined,
        phoneVerified: undefined,
        twoFactorEnabled: undefined,
        socialProvider: '',
        isLocked: undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        page: 0,
        size: 20
    });

    // Fetch Users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminUserService.getUsers({
                ...filters,
                page: currentPage,
                size: pageSize
            });

            if (response.success) {
                setUsers(response.data.users);
                setTotalPages(response.data.totalPages);
                setTotalElements(response.data.totalElements);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, pageSize]);

    // Fetch Statistics
    const fetchStatistics = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await adminUserService.getUserStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchStatistics();
    }, [fetchUsers, fetchStatistics]);

    // Handle Filter Changes
    const handleFilterChange = (key: keyof UserFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(0); // Reset to first page when filters change
    };

    // Handle Search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFilterChange('searchQuery', e.target.value);
    };

    // Handle Actions
    const handleToggleStatus = async (user: AdminUser) => {
        try {
            await adminUserService.toggleUserStatus(user.userId, !user.isActive);
            fetchUsers();
            fetchStatistics();
        } catch (error) {
            console.error('Failed to toggle user status:', error);
        }
    };

    const handleUnlockUser = async (userId: number) => {
        try {
            await adminUserService.unlockUser(userId);
            fetchUsers();
        } catch (error) {
            console.error('Failed to unlock user:', error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await adminUserService.deleteUser(userId);
            fetchUsers();
            fetchStatistics();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const clearFilters = () => {
        setFilters({
            searchQuery: '',
            role: '',
            isActive: undefined,
            emailVerified: undefined,
            phoneVerified: undefined,
            twoFactorEnabled: undefined,
            socialProvider: '',
            isLocked: undefined,
            sortBy: 'createdAt',
            sortDirection: 'desc',
            page: 0,
            size: 20
        });
        setCurrentPage(0);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                    <p className="text-gray-600 mt-1">Admin dashboard for user management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStatistics}
                        className="p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Refresh Statistics"
                    >
                        <RefreshCw className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={statistics?.totalUsers || 0}
                    icon={Users}
                    color="blue"
                    loading={statsLoading}
                />
                <StatCard
                    title="Active Users"
                    value={statistics?.activeUsers || 0}
                    icon={Activity}
                    color="green"
                    loading={statsLoading}
                />
                <StatCard
                    title="Verified Users"
                    value={statistics?.verifiedUsers || 0}
                    icon={UserCheck}
                    color="purple"
                    loading={statsLoading}
                />
                <StatCard
                    title="2FA Enabled"
                    value={statistics?.twoFactorUsers || 0}
                    icon={Shield}
                    color="yellow"
                    loading={statsLoading}
                />
            </div>

            {/* User Growth Stats */}
            {statistics && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Today</p>
                                <p className="text-xl font-semibold">{statistics.newUsersToday}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">This Week</p>
                                <p className="text-xl font-semibold">{statistics.newUsersThisWeek}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">This Month</p>
                                <p className="text-xl font-semibold">{statistics.newUsersThisMonth}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={filters.searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    {Object.values(filters).some(v => v !== '' && v !== undefined && v !== 'createdAt' && v !== 'desc' && v !== 0 && v !== 20) && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                        <select
                            value={filters.role || ''}
                            onChange={(e) => handleFilterChange('role', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Roles</option>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                        </select>

                        <select
                            value={filters.isActive === undefined ? '' : String(filters.isActive)}
                            onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>

                        <select
                            value={filters.emailVerified === undefined ? '' : String(filters.emailVerified)}
                            onChange={(e) => handleFilterChange('emailVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Email Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Not Verified</option>
                        </select>

                        <select
                            value={filters.phoneVerified === undefined ? '' : String(filters.phoneVerified)}
                            onChange={(e) => handleFilterChange('phoneVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Phone Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Not Verified</option>
                        </select>

                        <select
                            value={filters.twoFactorEnabled === undefined ? '' : String(filters.twoFactorEnabled)}
                            onChange={(e) => handleFilterChange('twoFactorEnabled', e.target.value === '' ? undefined : e.target.value === 'true')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">2FA Status</option>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>

                        <select
                            value={filters.isLocked === undefined ? '' : String(filters.isLocked)}
                            onChange={(e) => handleFilterChange('isLocked', e.target.value === '' ? undefined : e.target.value === 'true')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Lock Status</option>
                            <option value="true">Locked</option>
                            <option value="false">Unlocked</option>
                        </select>

                        <select
                            value={filters.sortBy || 'createdAt'}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="lastLoginAt">Last Login</option>
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                        </select>

                        <select
                            value={filters.sortDirection || 'desc'}
                            onChange={(e) => handleFilterChange('sortDirection', e.target.value as 'asc' | 'desc')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Users className="w-12 h-12 mb-3" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Verification
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Activity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <UserRow
                                    key={user.userId}
                                    user={user}
                                    onToggleStatus={() => handleToggleStatus(user)}
                                    onUnlock={() => handleUnlockUser(user.userId)}
                                    onDelete={() => handleDeleteUser(user.userId)}
                                />
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && users.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} users
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1.5 text-sm">
                                    Page {currentPage + 1} of {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Statistics Card Component
function StatCard({ title, value, icon: Icon, color, loading }: {
    title: string;
    value: number;
    icon: any;
    color: 'blue' | 'green' | 'purple' | 'yellow';
    loading: boolean;
}) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        yellow: 'bg-yellow-100 text-yellow-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    {loading ? (
                        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

// User Row Component
function UserRow({ user, onToggleStatus, onUnlock, onDelete }: {
    user: AdminUser;
    onToggleStatus: () => void;
    onUnlock: () => void;
    onDelete: () => void;
}) {
    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            ADMIN: 'bg-purple-100 text-purple-800',
            MANAGER: 'bg-blue-100 text-blue-800',
            USER: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.USER}`}>
                {role}
            </span>
        );
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        {user.profileImageUrl ? (
                            <img className="h-10 w-10 rounded-full" src={user.profileImageUrl} alt="" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {getRoleBadge(user.role)}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 space-y-1">
                    {user.phoneNumber && (
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {user.phoneNumber}
                        </div>
                    )}
                    {user.socialProvider && (
                        <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-400" />
                            {user.socialProvider}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.lockedUntil && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-gray-300'}`} title="Email" />
                    <span className={`w-2 h-2 rounded-full ${user.phoneVerified ? 'bg-green-500' : 'bg-gray-300'}`} title="Phone" />
                    <span className={`w-2 h-2 rounded-full ${user.twoFactorEnabled ? 'bg-blue-500' : 'bg-gray-300'}`} title="2FA" />
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="space-y-1">
                    <div className="text-xs">Created: {formatDate(new Date(user.createdAt))}</div>
                    {user.lastLoginAt && (
                        <div className="text-xs">Last login: {formatDate(new Date(user.lastLoginAt))}</div>
                    )}
                    {user.loginAttempts > 0 && (
                        <div className="text-xs text-red-600">Failed attempts: {user.loginAttempts}</div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleStatus}
                        className={`p-1.5 rounded-lg transition-colors ${
                            user.isActive
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                        {user.isActive ? <X className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    {user.lockedUntil && (
                        <button
                            onClick={onUnlock}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Unlock"
                        >
                            <Unlock className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}