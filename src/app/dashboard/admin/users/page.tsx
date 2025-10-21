// src/app/dashboard/admin/users/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Box,
    Download,
    Edit3,
    Eye,
    Filter,
    Loader2,
    Lock,
    MailCheck,
    RefreshCw,
    Search,
    Trash2,
    TrendingUp,
    Unlock,
    UserCheck,
    UserCog,
    UserPlus,
    Users,
} from 'lucide-react';
import {
    AdminUser,
    CreateUserPayload,
    UserFilters,
    UserStatistics,
    adminUserService,
} from '../../../../infrastructure/services/admin.service';
import { formatDate, formatNumber } from '../../../../shared/utils/cn';
import UserLockerModal from '../../../../presentation/components/users/UserLockerModal';
import UserFormModal, { UserFormValues } from '../../../../presentation/components/users/UserFormModal';
import UserDetailsDrawer from '../../../../presentation/components/users/UserDetailsDrawer';
import UserFiltersPanel from '../../../../presentation/components/users/UserFiltersPanel';

const DEFAULT_FILTERS: UserFilters = {
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
    size: 20,
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [statsLoading, setStatsLoading] = useState<boolean>(true);
    const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_FILTERS.size ?? 20);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>(DEFAULT_FILTERS.searchQuery ?? '');

    const [exporting, setExporting] = useState<boolean>(false);
    const [formLoading, setFormLoading] = useState<boolean>(false);

    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [selectedUserForLocker, setSelectedUserForLocker] = useState<{ id: number; name: string } | null>(null);

    const activeFiltersCount = useMemo(() => {
        const { page, size, sortBy, sortDirection, searchQuery, ...rest } = filters;
        let count = 0;

        if (searchQuery) count += 1;
        if (sortBy && sortBy !== DEFAULT_FILTERS.sortBy) count += 1;
        if (sortDirection && sortDirection !== DEFAULT_FILTERS.sortDirection) count += 1;

        Object.values(rest).forEach((value) => {
            if (value !== undefined && value !== null && value !== '') {
                count += 1;
            }
        });

        return count;
    }, [filters]);

    const fetchStatistics = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await adminUserService.getUserStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
            setStatistics({
                totalUsers: users.length,
                activeUsers: users.filter((user) => user.isActive).length,
                inactiveUsers: users.filter((user) => !user.isActive && !user.lockedUntil).length,
                verifiedEmails: users.filter((user) => user.emailVerified).length,
                unverifiedEmails: users.filter((user) => !user.emailVerified).length,
                verifiedPhones: users.filter((user) => user.phoneVerified).length,
                twoFactorEnabled: users.filter((user) => user.twoFactorEnabled).length,
                lockedAccounts: users.filter((user) => Boolean(user.lockedUntil)).length,
                usersByRole: users.reduce<Record<string, number>>((acc, user) => {
                    acc[user.role] = (acc[user.role] ?? 0) + 1;
                    return acc;
                }, {}),
                usersBySocialProvider: {},
                registrationTrend: [],
                loginActivity: { last24Hours: 0, last7Days: 0, last30Days: 0 },
                newUsersToday: 0,
                newUsersThisWeek: 0,
                newUsersThisMonth: 0,
                averageSessionDuration: undefined,
                topCountries: [],
            });
        } finally {
            setStatsLoading(false);
        }
    }, [users]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminUserService.getUsers({
                ...filters,
                page: currentPage,
                size: pageSize,
            });

            if (response.success) {
                const fetchedUsers = response.data.users ?? [];
                const pagination = response.data.pagination;
                const computedTotalElements = pagination?.totalElements ?? response.data.totalElements ?? fetchedUsers.length;
                const computedTotalPages = pagination?.totalPages ?? response.data.totalPages ?? (computedTotalElements > 0 ? Math.ceil(computedTotalElements / pageSize) : 0);

                if (fetchedUsers.length === 0 && computedTotalElements > 0 && currentPage > 0) {
                    const previousPage = Math.max(0, computedTotalPages - 1);
                    setCurrentPage(previousPage);
                    setFilters((prev) => ({ ...prev, page: previousPage }));
                    return;
                }

                setUsers(fetchedUsers);
                setTotalElements(computedTotalElements);
                setTotalPages(computedTotalPages);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, pageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setFilters((prev) => ({ ...prev, searchQuery: searchValue, page: 0 }));
            setCurrentPage(0);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchValue]);

    useEffect(() => {
        setSearchValue(filters.searchQuery ?? '');
    }, [filters.searchQuery]);

    const handleShowLockers = (user: AdminUser) => {
        setSelectedUserForLocker({ id: user.userId, name: user.name });
    };

    const handleLockToggle = async (user: AdminUser) => {
        try {
            if (user.lockedUntil) {
                await adminUserService.unlockUser(user.userId);
            } else {
                const lockedUntil = new Date();
                lockedUntil.setHours(lockedUntil.getHours() + 24);
                await adminUserService.updateUser(user.userId, {
                    lockedUntil: lockedUntil.toISOString(),
                    isActive: false,
                });
            }
            await fetchUsers();
        } catch (error) {
            console.error('Failed to toggle user lock:', error);
            alert('Unable to update user lock status.');
        }
    };

    const handleDeleteUser = async (user: AdminUser) => {
        if (!confirm(`Delete ${user.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await adminUserService.deleteUser(user.userId);
            await fetchUsers();
            await fetchStatistics();
            if (selectedUser?.userId === user.userId) {
                setSelectedUser(null);
                setShowDetails(false);
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Unable to delete user.');
        }
    };

    const handleResetPassword = async (user: AdminUser) => {
        if (!confirm(`Send password reset email to ${user.email}?`)) {
            return;
        }

        try {
            await adminUserService.resetPassword(user.userId);
            alert('Password reset instructions sent successfully.');
        } catch (error) {
            console.error('Failed to reset password:', error);
            alert('Unable to send reset password email.');
        }
    };

    const handleCreateUser = async (values: UserFormValues) => {
        setFormLoading(true);
        const payload: CreateUserPayload = {
            name: values.name,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            phoneNumber: values.phoneNumber || undefined,
            role: values.role,
            isActive: values.isActive,
            emailVerified: values.emailVerified,
            phoneVerified: values.phoneVerified,
        };

        try {
            await adminUserService.createUser(payload);
            alert('User created successfully.');
            setShowCreateModal(false);
            await fetchUsers();
            await fetchStatistics();
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Unable to create user. Please check the details and try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditUser = async (values: UserFormValues) => {
        if (!editingUser) return;

        setFormLoading(true);
        const payload: Partial<AdminUser> = {
            name: values.name,
            phoneNumber: values.phoneNumber,
            role: values.role,
            isActive: values.isActive,
            emailVerified: values.emailVerified,
            phoneVerified: values.phoneVerified,
        };

        try {
            await adminUserService.updateUser(editingUser.userId, payload);
            alert('User updated successfully.');
            setShowEditModal(false);
            setEditingUser(null);
            await fetchUsers();
            await fetchStatistics();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Unable to update user.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleExportUsers = async () => {
        setExporting(true);
        try {
            const exportedUsers = await adminUserService.exportUsers(filters);
            if (!exportedUsers || exportedUsers.length === 0) {
                alert('No users available to export for the selected filters.');
                return;
            }

            const header = [
                'ID',
                'Name',
                'Email',
                'Role',
                'Phone Number',
                'Active',
                'Email Verified',
                'Phone Verified',
                'Two Factor',
                'Created At',
                'Last Login At',
            ];

            const rows = exportedUsers.map((user) => [
                user.userId,
                `"${user.name ?? ''}"`,
                user.email,
                user.role,
                user.phoneNumber ?? '',
                user.isActive,
                user.emailVerified,
                user.phoneVerified,
                user.twoFactorEnabled,
                user.createdAt,
                user.lastLoginAt ?? '',
            ]);

            const csvContent = [header, ...rows]
                .map((row) => row.join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export users:', error);
            alert('Unable to export users.');
        } finally {
            setExporting(false);
        }
    };

    const handleApplyFilters = (nextFilters: UserFilters) => {
        setFilters((prev) => ({ ...prev, ...nextFilters }));
        setCurrentPage(nextFilters.page ?? 0);
        if (nextFilters.size) {
            setPageSize(nextFilters.size);
        }
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setCurrentPage(0);
        setPageSize(DEFAULT_FILTERS.size ?? 20);
    };

    const handlePageSizeChange = (value: number) => {
        setPageSize(value);
        setCurrentPage(0);
        setFilters((prev) => ({ ...prev, size: value, page: 0 }));
    };

    const handlePageChange = (nextPage: number) => {
        setCurrentPage(nextPage);
        setFilters((prev) => ({ ...prev, page: nextPage }));
    };

    const startRange = totalElements === 0 ? 0 : currentPage * pageSize + 1;
    const endRange = Math.min(totalElements, currentPage * pageSize + users.length);

    return (
        <div className="min-h-screen space-y-6 bg-gray-50 p-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Administration</p>
                    <h1 className="mt-1 text-3xl font-bold text-gray-900">User management</h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        Monitor account health, onboard teammates, and keep your customer directory organised.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleExportUsers}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <UserPlus className="h-4 w-4" />
                        New user
                    </button>
                </div>
            </div>

            {statsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="h-32 rounded-2xl bg-white/60 shadow-sm ring-1 ring-inset ring-white/50">
                            <div className="h-full animate-pulse rounded-2xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
                        </div>
                    ))}
                </div>
            ) : (
                statistics && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total users</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">
                                        {formatNumber(statistics.totalUsers)}
                                    </p>
                                </div>
                                <Users className="h-10 w-10 text-blue-600" />
                            </div>
                            <p className="mt-3 text-sm text-gray-500">{statistics.newUsersThisMonth} joined this month</p>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active accounts</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(statistics.activeUsers)}</p>
                                </div>
                                <UserCheck className="h-10 w-10 text-green-600" />
                            </div>
                            <p className="mt-3 text-sm text-gray-500">{statistics.lockedAccounts} currently locked</p>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Verified emails</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(statistics.verifiedEmails)}</p>
                                </div>
                                <MailCheck className="h-10 w-10 text-purple-600" />
                            </div>
                            <p className="mt-3 text-sm text-gray-500">{statistics.unverifiedEmails} pending verification</p>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">New sign-ups</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{statistics.newUsersToday}</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-orange-500" />
                            </div>
                            <p className="mt-3 text-sm text-gray-500">{statistics.loginActivity.last7Days} logins last 7 days</p>
                        </div>
                    </div>
                )
            )}

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="space-y-4 border-b p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    placeholder="Search by name, email or phone"
                                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>
                                Showing {startRange} – {endRange} of {totalElements}
                            </span>
                            <button
                                onClick={fetchUsers}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <UserFiltersPanel
                    visible={showFilters}
                    filters={{ ...filters, page: currentPage, size: pageSize }}
                    onClose={() => setShowFilters(false)}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                />

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Role & channel
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Verification
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Last activity
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-sm text-gray-500">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-600">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading users…
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-sm text-gray-500">
                                        <div className="mx-auto w-full max-w-md rounded-2xl border border-dashed border-gray-200 p-8">
                                            <UserCog className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-4 font-semibold text-gray-700">No users match your filters</p>
                                            <p className="mt-1 text-sm text-gray-500">Try adjusting the search term or clearing the filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const statusLabel = user.isActive ? 'Active' : user.lockedUntil ? 'Locked' : 'Inactive';
                                    const statusClass = user.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : user.lockedUntil
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-600';

                                    return (
                                        <tr key={user.userId} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                {user.phoneNumber && <div className="text-sm text-gray-400">{user.phoneNumber}</div>}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                    {user.socialProvider && (
                                                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                                            {user.socialProvider}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                                                    {statusLabel}
                                                </span>
                                                <div className="mt-1 text-xs text-gray-400">
                                                    {user.loginAttempts} failed attempts
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-semibold ${user.emailVerified ? 'text-green-600' : 'text-gray-400'}`}>
                                                        Email
                                                    </span>
                                                    <span className={`text-xs font-semibold ${user.phoneVerified ? 'text-green-600' : 'text-gray-400'}`}>
                                                        Phone
                                                    </span>
                                                    <span className={`text-xs font-semibold ${user.twoFactorEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        2FA
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                {user.lastLoginAt ? (
                                                    <>
                                                        <div>{formatDate(user.lastLoginAt, 'time')}</div>
                                                        <div className="text-xs text-gray-400">{user.lastLoginIp ?? 'Unknown IP'}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Never logged in</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDetails(true);
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                                                        title="View details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                                                        title="Edit user"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleShowLockers(user)}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                                                        title="Locker overview"
                                                    >
                                                        <Box className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleLockToggle(user)}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                                                        title={user.lockedUntil ? 'Unlock account' : 'Lock account'}
                                                    >
                                                        {user.lockedUntil ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(user)}
                                                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                                                        title="Send reset password"
                                                    >
                                                        <Activity className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex flex-col gap-4 border-t bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                                    const pageNumber = index;
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
                                                currentPage === pageNumber
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {pageNumber + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Next
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Rows per page</span>
                            <select
                                value={pageSize}
                                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                {[10, 20, 50, 100].map((sizeOption) => (
                                    <option key={sizeOption} value={sizeOption}>
                                        {sizeOption}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <UserFormModal
                    mode="create"
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateUser}
                    loading={formLoading}
                />
            )}

            {showEditModal && editingUser && (
                <UserFormModal
                    mode="edit"
                    open={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                    }}
                    onSubmit={handleEditUser}
                    initialData={editingUser}
                    loading={formLoading}
                />
            )}

            <UserDetailsDrawer
                user={selectedUser}
                open={showDetails}
                onClose={() => setShowDetails(false)}
                onEdit={(user) => {
                    setEditingUser(user);
                    setShowEditModal(true);
                }}
                onResetPassword={handleResetPassword}
            />

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
