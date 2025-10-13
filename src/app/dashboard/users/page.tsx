// Users Management Page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { Table, Column } from '../../../presentation/components/ui/Table';
import { Pagination } from '../../../presentation/components/ui/Pagination';
import { Modal } from '../../../presentation/components/ui/Modal';
import { User, UserRole, UserStatus } from '../../../core/entities';
import { userRepository } from '../../../infrastructure/repositories/user.repository';
import { formatDate, cn, debounce } from '../../../shared/utils/cn';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await userRepository.getAll({
                page: currentPage,
                limit: 10,
                search: searchQuery,
                sortBy,
                sortOrder,
            });

            setUsers(response.data);
            setTotalPages(response.totalPages);
            setTotalItems(response.total);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, sortBy, sortOrder]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const debouncedSearch = useCallback(
        debounce((query: string) => {
            setSearchQuery(query);
            setCurrentPage(1);
        }, 500),
        []
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await userRepository.delete(userId);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: UserStatus) => {
        const styles = {
            ACTIVE: 'bg-green-100 text-green-800',
            INACTIVE: 'bg-gray-100 text-gray-800',
            SUSPENDED: 'bg-red-100 text-red-800',
        };

        return (
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', styles[status])}>
                {status}
            </span>
        );
    };

    const getRoleBadge = (role: UserRole) => {
        const styles = {
            ADMIN: 'bg-purple-100 text-purple-800',
            MANAGER: 'bg-blue-100 text-blue-800',
            USER: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', styles[role])}>
                {role}
            </span>
        );
    };

    const columns: Column<User>[] = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (user) => (
                <div className="flex items-center gap-3">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (user) =>
                user.phone ? (
                    <span className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {user.phone}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (user) => getRoleBadge(user.role),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (user) => getStatusBadge(user.status),
        },
        {
            key: 'createdAt',
            label: 'Joined',
            sortable: true,
            render: (user) => (
                <span className="flex items-center gap-1 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(user.createdAt)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (user) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add User
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <Table
                data={users}
                columns={columns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                loading={loading}
                emptyMessage="No users found"
            />

            {/* Pagination */}
            {!loading && users.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={10}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Edit User' : 'Add New User'}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        User form implementation goes here. Connect to your form library (react-hook-form + zod).
                    </p>
                </div>
            </Modal>
        </div>
    );
}