// src/app/dashboard/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, UserCheck, Shield, Activity, Calendar, TrendingUp,
    Search, Filter, Download, RefreshCw, Trash2,
    Lock, Unlock, Phone, Globe, ChevronDown, X, UserCog, Box
} from 'lucide-react';
import { adminUserService, AdminUser, UserStatistics, UserFilters } from '../../../../infrastructure/services/admin.service';
import { formatDate } from '../../../../shared/utils/cn';
import UserLockerModal from '../../../../presentation/components/users/UserLockerModal';

export default function AdminUsersPage() {
    // State Management
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedUserForLocker, setSelectedUserForLocker] = useState<{id: number, name: string} | null>(null);

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
        isLocked: undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        createdAfter: '',
        createdBefore: '',
        lastLoginAfter: '',
        lastLoginBefore: '',
        socialProvider: '',
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
    const fetchStatistics = async () => {
        setStatsLoading(true);
        try {
            const response = await adminUserService.getUserStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
            // Use static fallback data
            setStatistics({
                totalUsers: users.length || 0,
                activeUsers: users.filter(u => u.isActive).length || 0,
                verifiedUsers: users.filter(u => u.emailVerified).length || 0,
                twoFactorUsers: users.filter(u => u.twoFactorEnabled).length || 0,
                newUsersToday: 0,
                newUsersThisWeek: 0,
                newUsersThisMonth: 0,
                usersByRole: {}
            });
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchStatistics();
    }, [fetchUsers]);

    const handleShowLockers = (userId: number, userName: string) => {
        setSelectedUserForLocker({ id: userId, name: userName });
    };

    const handleLockToggle = async (userId: number, isLocked: boolean) => {
        try {
            if (isLocked) {
                // Unlock user
                await adminUserService.unlockUser(userId);
            } else {
                // Lock user by setting lockedUntil to 24 hours from now
                const lockedUntil = new Date();
                lockedUntil.setHours(lockedUntil.getHours() + 24);
                await adminUserService.updateUser(userId, {
                    lockedUntil: lockedUntil.toISOString(),
                    isActive: false
                });
            }
            fetchUsers();
        } catch (error) {
            console.error('Failed to toggle user lock:', error);
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

    // Rest of the helper functions remain the same...
    const handlePageSizeChange = (value: number) => {
        setPageSize(value);
        setFilters(prev => ({ ...prev, size: value }));
        setCurrentPage(0);
    };

    const clearFilters = () => {
        setFilters({
            searchQuery: '',
            role: '',
            isActive: undefined,
            emailVerified: undefined,
            phoneVerified: undefined,
            twoFactorEnabled: undefined,
            createdAfter: '',
            createdBefore: '',
            lastLoginAfter: '',
            lastLoginBefore: '',
            socialProvider: '',
            isLocked: undefined,
            sortBy: 'createdAt',
            sortDirection: 'desc',
            page: 0,
            size: 20
        });
        setCurrentPage(0);
        setPageSize(20);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-500 mt-1">Manage and monitor all system users</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold">{statistics.totalUsers}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Users</p>
                                <p className="text-2xl font-bold">{statistics.activeUsers}</p>
                            </div>
                            <UserCheck className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Verified Users</p>
                                <p className="text-2xl font-bold">{statistics.verifiedUsers}</p>
                            </div>
                            <Shield className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">New Today</p>
                                <p className="text-2xl font-bold">{statistics.newUsersToday}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm">
                {/* Table Header with Filters */}
                <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={filters.searchQuery}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>
                        <div className="text-sm text-gray-500">
                            Showing {users.length} of {totalElements} users
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left p-4 font-medium text-gray-700">User</th>
                            <th className="text-left p-4 font-medium text-gray-700">Role</th>
                            <th className="text-left p-4 font-medium text-gray-700">Status</th>
                            <th className="text-left p-4 font-medium text-gray-700">Verification</th>
                            <th className="text-left p-4 font-medium text-gray-700">Last Login</th>
                            <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center p-8">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.userId} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                            <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                                {user.role}
                                            </span>
                                    </td>
                                    <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                user.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : user.lockedUntil
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {user.isActive ? 'Active' : user.lockedUntil ? 'Locked' : 'Inactive'}
                                            </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {user.emailVerified && (
                                                <span className="text-green-600" title="Email verified">✉️</span>
                                            )}
                                            {user.phoneVerified && (
                                                <span className="text-green-600" title="Phone verified">📱</span>
                                            )}
                                            {user.twoFactorEnabled && (
                                                <span className="text-blue-600" title="2FA enabled">🔐</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm">
                                            {user.lastLoginAt ? (
                                                <>
                                                    <div>{formatDate(new Date(user.lastLoginAt))}</div>
                                                    <div className="text-gray-500">{user.lastLoginIp}</div>
                                                </>
                                            ) : (
                                                <span className="text-gray-500">Never</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleShowLockers(user.userId, user.name)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Show Lockers"
                                            >
                                                <Box className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleLockToggle(user.userId, !!user.lockedUntil)}
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                                                title={user.lockedUntil ? "Unlock User" : "Lock User"}
                                            >
                                                {user.lockedUntil ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.userId)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`px-3 py-1 border rounded ${
                                        currentPage === i ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="border rounded px-3 py-1"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Locker Modal */}
            {selectedUserForLocker && (
                <UserLockerModal
                    userId={selectedUserForLocker.id}
                    userName={selectedUserForLocker.name}
                    onClose={() => setSelectedUserForLocker(null)}
                />
            )}
        </div>
    );
}