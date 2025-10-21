// src/presentation/components/users/UserFiltersPanel.tsx

'use client';

import { useEffect, useState } from 'react';
import { Filter, RefreshCcw } from 'lucide-react';
import { UserFilters } from '../../../infrastructure/services/admin.service';

interface UserFiltersPanelProps {
    visible: boolean;
    filters: UserFilters;
    onClose: () => void;
    onApply: (filters: UserFilters) => void;
    onClear: () => void;
}

const roles = ['', 'ADMIN', 'USER', 'VENDOR', 'DELIVERY_PERSON'];

export default function UserFiltersPanel({ visible, filters, onClose, onApply, onClear }: UserFiltersPanelProps) {
    const [draft, setDraft] = useState<UserFilters>(filters);

    useEffect(() => {
        if (visible) {
            setDraft(filters);
        }
    }, [visible, filters]);

    if (!visible) {
        return null;
    }

    const handleBooleanChange = (key: keyof UserFilters, value: string) => {
        if (value === '') {
            setDraft((prev) => ({ ...prev, [key]: undefined }));
        } else {
            setDraft((prev) => ({ ...prev, [key]: value === 'true' }));
        }
    };

    const applyFilters = () => {
        onApply({ ...draft, page: 0 });
        onClose();
    };

    return (
        <div className="border-b bg-gray-50">
            <div className="mx-auto grid gap-4 px-4 py-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Role</label>
                    <select
                        value={draft.role ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        {roles.map((role) => (
                            <option key={role || 'all'} value={role}>
                                {role ? role.replace('_', ' ') : 'All roles'}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Account status</label>
                    <select
                        value={draft.isActive === undefined ? '' : String(draft.isActive)}
                        onChange={(event) => handleBooleanChange('isActive', event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="">All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Email verified</label>
                    <select
                        value={draft.emailVerified === undefined ? '' : String(draft.emailVerified)}
                        onChange={(event) => handleBooleanChange('emailVerified', event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="">All</option>
                        <option value="true">Verified</option>
                        <option value="false">Not verified</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Phone verified</label>
                    <select
                        value={draft.phoneVerified === undefined ? '' : String(draft.phoneVerified)}
                        onChange={(event) => handleBooleanChange('phoneVerified', event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="">All</option>
                        <option value="true">Verified</option>
                        <option value="false">Not verified</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Two factor</label>
                    <select
                        value={draft.twoFactorEnabled === undefined ? '' : String(draft.twoFactorEnabled)}
                        onChange={(event) => handleBooleanChange('twoFactorEnabled', event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="">All</option>
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Locked status</label>
                    <select
                        value={draft.isLocked === undefined ? '' : String(draft.isLocked)}
                        onChange={(event) => handleBooleanChange('isLocked', event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="">All</option>
                        <option value="true">Locked</option>
                        <option value="false">Unlocked</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Social provider</label>
                    <input
                        type="text"
                        value={draft.socialProvider ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, socialProvider: event.target.value }))}
                        placeholder="GOOGLE, FACEBOOK, APPLE"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Created after</label>
                    <input
                        type="date"
                        value={draft.createdAfter ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, createdAfter: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Created before</label>
                    <input
                        type="date"
                        value={draft.createdBefore ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, createdBefore: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Last login after</label>
                    <input
                        type="date"
                        value={draft.lastLoginAfter ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, lastLoginAfter: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Last login before</label>
                    <input
                        type="date"
                        value={draft.lastLoginBefore ?? ''}
                        onChange={(event) => setDraft((prev) => ({ ...prev, lastLoginBefore: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Sort by</label>
                    <select
                        value={draft.sortBy ?? 'createdAt'}
                        onChange={(event) => setDraft((prev) => ({ ...prev, sortBy: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="createdAt">Created date</option>
                        <option value="lastLoginAt">Last login</option>
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Sort direction</label>
                    <select
                        value={draft.sortDirection ?? 'desc'}
                        onChange={(event) => setDraft((prev) => ({ ...prev, sortDirection: event.target.value as 'asc' | 'desc' }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Filter className="h-4 w-4" />
                    <span>Advanced filters applied</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setDraft(filters);
                            onClear();
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Reset
                    </button>
                    <button
                        onClick={applyFilters}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Apply filters
                    </button>
                </div>
            </div>
        </div>
    );
}
