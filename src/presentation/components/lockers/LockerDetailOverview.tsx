// src/presentation/components/lockers/LockerDetailOverview.tsx
'use client';

import React from 'react';
import {
    Activity,
    AlertTriangle,
    Calendar,
    ClipboardCheck,
    Clock,
    MapPin,
    ShieldCheck,
    Users,
    Tag,
    History,
} from 'lucide-react';
import { LockerDetails, LockerMaintenanceRecord } from '../../../core/entities/lockers';
import { cn } from '../../../shared/utils/cn';

interface LockerDetailOverviewProps {
    locker: LockerDetails | null;
    loading?: boolean;
    issueCount: number;
    onViewMaintenance: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    OCCUPIED: 'bg-blue-100 text-blue-700 border-blue-200',
    RESERVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
    OUT_OF_SERVICE: 'bg-rose-100 text-rose-700 border-rose-200',
    INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
};

const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
    OPERATIONAL: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REQUIRES_MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
    UNDER_MAINTENANCE: 'bg-blue-100 text-blue-700 border-blue-200',
};

function formatDate(value?: string | null, withTime = true): string {
    if (!value) return '—';
    const date = new Date(value);
    return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

function findUpcomingMaintenance(records: LockerMaintenanceRecord[]): LockerMaintenanceRecord | null {
    return (
        records.find((record) => record.status !== 'COMPLETED' && record.status !== 'CANCELLED') ?? null
    );
}

function findLastMaintenance(records: LockerMaintenanceRecord[]): LockerMaintenanceRecord | null {
    const completed = records
        .filter((record) => record.status === 'COMPLETED')
        .sort((a, b) => new Date(b.completedAt ?? b.scheduledDate).getTime() - new Date(a.completedAt ?? a.scheduledDate).getTime());
    return completed[0] ?? null;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="h-36 rounded-xl bg-white" />
                <div className="h-36 rounded-xl bg-white" />
                <div className="h-36 rounded-xl bg-white" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-40 rounded-xl bg-white" />
                <div className="h-40 rounded-xl bg-white" />
            </div>
        </div>
    );
}

export default function LockerDetailOverview({ locker, loading = false, issueCount, onViewMaintenance }: LockerDetailOverviewProps) {
    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!locker) {
        return (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
                <p className="text-sm">Select a locker from the list to review its operational details.</p>
            </div>
        );
    }

    const statusStyle = STATUS_COLORS[locker.status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
    const maintenanceStyle = locker.maintenanceStatus
        ? MAINTENANCE_STATUS_COLORS[locker.maintenanceStatus] ?? 'bg-gray-100 text-gray-700 border-gray-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';

    const activeReservations = locker.activeReservations ?? [];
    const maintenanceHistory = locker.maintenanceHistory ?? [];
    const upcomingMaintenance = findUpcomingMaintenance(maintenanceHistory);
    const lastMaintenance = findLastMaintenance(maintenanceHistory);

    const maintenanceTasks = upcomingMaintenance?.tasks?.length
        ? upcomingMaintenance.tasks
        : lastMaintenance?.completedTasks ?? [];

    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Locker</p>
                            <h2 className="text-xl font-bold text-gray-900">{locker.name ?? locker.code}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={cn('text-xs font-medium px-3 py-1 rounded-full border', statusStyle)}>
                                {locker.status}
                            </span>
                            {locker.maintenanceStatus && (
                                <span className={cn('text-xs font-medium px-3 py-1 rounded-full border', maintenanceStyle)}>
                                    {locker.maintenanceStatus.replace(/_/g, ' ')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-start gap-3">
                            <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{locker.code}</p>
                                <p>Locker #{locker.lockerNumber}</p>
                            </div>
                        </div>
                        {locker.location && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">{locker.location.name}</p>
                                    <p>{locker.location.address}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Subscription</p>
                                <p>{locker.subscriptionId}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilization</p>
                            <h3 className="text-lg font-semibold text-gray-900">Capacity & Issues</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-lg bg-blue-50 px-4 py-3">
                            <p className="text-xs text-blue-700 uppercase tracking-wide">Available Capacity</p>
                            <p className="text-xl font-semibold text-blue-900">
                                {locker.availableCapacity ?? 0} / {locker.maxCapacity ?? 0}
                            </p>
                        </div>
                        <div className="rounded-lg bg-rose-50 px-4 py-3">
                            <p className="text-xs text-rose-700 uppercase tracking-wide">Active Issues</p>
                            <p className="text-xl font-semibold text-rose-900">{issueCount}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-4 py-3">
                            <p className="text-xs text-emerald-700 uppercase tracking-wide">Reservations</p>
                            <p className="text-xl font-semibold text-emerald-900">{activeReservations.length}</p>
                        </div>
                        <div className="rounded-lg bg-indigo-50 px-4 py-3">
                            <p className="text-xs text-indigo-700 uppercase tracking-wide">Last Updated</p>
                            <p className="text-sm font-semibold text-indigo-900">{formatDate(locker.updatedAt)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <History className="w-5 h-5 text-indigo-600" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maintenance</p>
                            <h3 className="text-lg font-semibold text-gray-900">Timeline Overview</h3>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-xs uppercase text-gray-500">Last Maintenance</p>
                                <p className="font-medium text-gray-900">{formatDate(locker.lastMaintenanceDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-xs uppercase text-gray-500">Next Due</p>
                                <p className="font-medium text-gray-900">{formatDate(locker.nextMaintenanceDue, false)}</p>
                            </div>
                        </div>
                        {upcomingMaintenance && (
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-xs uppercase text-amber-600">Upcoming Work</p>
                                    <p className="font-medium text-gray-900">{upcomingMaintenance.maintenanceType}</p>
                                    <p>{formatDate(upcomingMaintenance.scheduledDate)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onViewMaintenance}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        View maintenance history
                    </button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Reservations</p>
                            <h3 className="text-lg font-semibold text-gray-900">Customer Access</h3>
                        </div>
                    </div>

                    {activeReservations.length === 0 ? (
                        <p className="text-sm text-gray-500">No active reservations right now.</p>
                    ) : (
                        <div className="space-y-3">
                            {activeReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className="border border-emerald-100 rounded-lg px-4 py-3"
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-gray-900">Reservation #{reservation.id.slice(0, 8)}…</span>
                                        <span className="text-xs font-medium text-emerald-600">
                                            {reservation.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid gap-2 text-xs text-gray-600 md:grid-cols-2">
                                        <p>
                                            <span className="font-medium text-gray-900">User:</span> #{reservation.userId}
                                        </p>
                                        {reservation.orderId && (
                                            <p>
                                                <span className="font-medium text-gray-900">Order:</span> {reservation.orderId}
                                            </p>
                                        )}
                                        <p>
                                            <span className="font-medium text-gray-900">From:</span> {formatDate(reservation.reservedFrom)}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-900">Until:</span> {formatDate(reservation.reservedUntil)}
                                        </p>
                                        {reservation.accessCode && (
                                            <p>
                                                <span className="font-medium text-gray-900">Access Code:</span> {reservation.accessCode}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maintenance Tasks</p>
                            <h3 className="text-lg font-semibold text-gray-900">Technician Checklist</h3>
                        </div>
                    </div>

                    {maintenanceTasks.length === 0 ? (
                        <p className="text-sm text-gray-500">No maintenance tasks recorded yet.</p>
                    ) : (
                        <ul className="space-y-2 text-sm text-gray-700">
                            {maintenanceTasks.map((task, index) => (
                                <li key={`${task}-${index}`} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    <span>{task}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
