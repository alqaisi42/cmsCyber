// src/presentation/components/locker-operations/LockerOperationsWorkspace.tsx

'use client';

import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Boxes,
    CalendarCheck,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Filter,
    Layers3,
    Loader2,
    MapPin,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Users,
    Wrench,
} from 'lucide-react';
import { cn } from '../../../shared/utils/cn';
import { StatsCard } from '../ui/StatsCard';
import { useLockerOperations } from '../../hooks/useLockerOperations';
import { CreateLockerModal } from './CreateLockerModal';
import { BulkCreateLockersModal } from './BulkCreateLockersModal';
import { UpdateLockerStatusModal } from './UpdateLockerStatusModal';
import { ReportIssueModal } from './ReportIssueModal';
import { ScheduleMaintenanceModal } from './ScheduleMaintenanceModal';
import { UpdateIssueModal } from './UpdateIssueModal';
import { UpdateMaintenanceModal } from './UpdateMaintenanceModal';
import { LockerIssue, LockerMaintenanceRecord } from '../../../core/entities/lockers';
import { UpdateIssuePayload, UpdateMaintenancePayload } from '../../../core/entities/locker-operations';

function formatDate(date?: string | null) {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleString();
}

const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    OCCUPIED: 'bg-blue-100 text-blue-700 border-blue-200',
    RESERVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
    OUT_OF_SERVICE: 'bg-rose-100 text-rose-700 border-rose-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const maintenanceColors: Record<string, string> = {
    OPERATIONAL: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REQUIRES_MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
    UNDER_MAINTENANCE: 'bg-rose-100 text-rose-700 border-rose-200',
};

export function LockerOperationsWorkspace() {
    const {
        locations,
        selectedLocation,
        selectedLocationId,
        locationOverview,
        lockers,
        issues,
        maintenanceRecords,
        reservations,
        subscriptions,
        selectedLocker,
        loadingList,
        loadingOverview,
        loadingLockerInsights,
        setSelectedLocationId,
        setSelectedLockerId,
        createLocker,
        bulkCreateLockers,
        updateLockerStatus,
        createIssue,
        updateIssue,
        addIssueComment,
        scheduleMaintenance,
        updateMaintenance,
    } = useLockerOperations();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isBulkModalOpen, setBulkModalOpen] = useState(false);
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);
    const [isIssueModalOpen, setIssueModalOpen] = useState(false);
    const [isUpdateIssueModalOpen, setUpdateIssueModalOpen] = useState(false);
    const [issueToUpdate, setIssueToUpdate] = useState<LockerIssue | null>(null);
    const [isMaintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [isUpdateMaintenanceModalOpen, setUpdateMaintenanceModalOpen] = useState(false);
    const [maintenanceToUpdate, setMaintenanceToUpdate] = useState<LockerMaintenanceRecord | null>(null);

    const filteredLocations = useMemo(() => {
        if (!searchTerm.trim()) return locations;
        return locations.filter((location) =>
            `${location.name} ${location.code ?? ''} ${location.address ?? ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [locations, searchTerm]);

    const locationLockers = useMemo(() => {
        if (locationOverview?.lockers?.length) {
            return locationOverview.lockers;
        }
        if (selectedLocationId) {
            return lockers.filter((locker) => locker.locationId === selectedLocationId);
        }
        return lockers;
    }, [locationOverview?.lockers, lockers, selectedLocationId]);

    const statistics = locationOverview?.statistics ?? {
        totalLockers: locationLockers.length,
        availableLockers: locationLockers.filter((locker) => locker.status === 'AVAILABLE').length,
        occupiedLockers: locationLockers.filter((locker) => locker.status === 'OCCUPIED').length,
        maintenanceLockers: locationLockers.filter((locker) => locker.status === 'MAINTENANCE').length,
    };

    const activeLocker = useMemo(() => {
        if (selectedLocker) return selectedLocker;
        if (locationLockers.length === 1) return locationLockers[0];
        return locationLockers.find((locker) => locker.id === selectedLockerId) ?? locationLockers[0] ?? null;
    }, [locationLockers, selectedLocker, selectedLockerId]);

    const isLoading = loadingList || loadingOverview;

    const handleUpdateIssue = async (payload: UpdateIssuePayload) => {
        if (!issueToUpdate) return;
        await updateIssue(issueToUpdate.id, payload, issueToUpdate.lockerId);
        setUpdateIssueModalOpen(false);
        setIssueToUpdate(null);
    };

    const handleUpdateMaintenance = async (payload: UpdateMaintenancePayload) => {
        if (!maintenanceToUpdate) return;
        await updateMaintenance(maintenanceToUpdate.id, payload, maintenanceToUpdate.lockerId);
        setUpdateMaintenanceModalOpen(false);
        setMaintenanceToUpdate(null);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Locker Operations Control</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">Locations, Lockers & Support</h1>
                    <p className="mt-2 max-w-3xl text-sm text-gray-600">
                        Manage locker deployments, subscriptions, reservations, and operational tasks from a single workspace.
                        Track issues and maintenance effortlessly with full visibility per location.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Create Locker
                    </button>
                    <button
                        onClick={() => setBulkModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <Layers3 className="h-4 w-4" />
                        Bulk Create
                    </button>
                    <button
                        onClick={() => activeLocker && setStatusModalOpen(true)}
                        disabled={!activeLocker}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Update Status
                    </button>
                    <button
                        onClick={() => activeLocker && setMaintenanceModalOpen(true)}
                        disabled={!activeLocker}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Wrench className="h-4 w-4" />
                        Schedule Maintenance
                    </button>
                    <button
                        onClick={() => activeLocker && setIssueModalOpen(true)}
                        disabled={!activeLocker}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Report Issue
                    </button>
                </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-4">
                <aside className="xl:col-span-1">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">Locations</h2>
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="relative mt-4">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
                                placeholder="Search locations"
                            />
                        </div>
                        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                            {filteredLocations.map((location) => {
                                const isActive = location.id === selectedLocationId;
                                return (
                                    <button
                                        key={location.id}
                                        onClick={() => setSelectedLocationId(location.id)}
                                        className={cn(
                                            'w-full rounded-xl border px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50',
                                            isActive
                                                ? 'border-blue-500 bg-blue-50 shadow'
                                                : 'border-gray-200 bg-white'
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{location.name}</p>
                                                {location.address && (
                                                    <p className="text-xs text-gray-500">{location.address}</p>
                                                )}
                                            </div>
                                            <ChevronRight className={cn('h-4 w-4', isActive ? 'text-blue-500' : 'text-gray-300')} />
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="rounded-lg bg-slate-100 py-1 text-slate-700">
                                                <p className="font-semibold">{location.totalLockers}</p>
                                                <p>Total</p>
                                            </div>
                                            <div className="rounded-lg bg-emerald-100 py-1 text-emerald-700">
                                                <p className="font-semibold">{location.availableLockers}</p>
                                                <p>Open</p>
                                            </div>
                                            <div className="rounded-lg bg-amber-100 py-1 text-amber-700">
                                                <p className="font-semibold">{location.maintenanceLockers}</p>
                                                <p>Attention</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {!filteredLocations.length && (
                                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                    No locations match your search.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <section className="xl:col-span-3 space-y-6">
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Active Location</p>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {selectedLocation?.name || 'Select a location'}
                                </h2>
                                {selectedLocation?.address && (
                                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {selectedLocation.address}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1">
                                    <Users className="h-3 w-3 text-blue-500" /> {subscriptions.length} subscriptions
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1">
                                    <CalendarCheck className="h-3 w-3 text-emerald-500" /> {reservations.length} reservations
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500" /> {issues.length} issues
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatsCard
                                title="Total lockers"
                                value={statistics.totalLockers}
                                icon={<Boxes className="h-5 w-5" />}
                                color="blue"
                            />
                            <StatsCard
                                title="Available"
                                value={statistics.availableLockers}
                                icon={<ShieldCheck className="h-5 w-5" />}
                                color="green"
                            />
                            <StatsCard
                                title="Occupied"
                                value={statistics.occupiedLockers}
                                icon={<Users className="h-5 w-5" />}
                                color="purple"
                            />
                            <StatsCard
                                title="Maintenance"
                                value={statistics.maintenanceLockers}
                                icon={<Wrench className="h-5 w-5" />}
                                color="yellow"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Lockers</h3>
                            <button
                                onClick={() => setStatusModalOpen(true)}
                                disabled={!activeLocker}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh status
                            </button>
                        </div>
                        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Locker</th>
                                        <th className="px-4 py-3">Subscription</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Maintenance</th>
                                        <th className="px-4 py-3 text-right">Capacity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {locationLockers.map((locker) => {
                                        const isActive = locker.id === activeLocker?.id;
                                        return (
                                            <tr
                                                key={locker.id}
                                                onClick={() => setSelectedLockerId(locker.id)}
                                                className={cn(
                                                    'cursor-pointer transition hover:bg-blue-50',
                                                    isActive ? 'bg-blue-50/70' : 'bg-white'
                                                )}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-gray-900">{locker.name || locker.code}</div>
                                                    <div className="text-xs text-gray-500">{locker.code}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-gray-700">{locker.subscriptionId || '—'}</div>
                                                    <div className="text-xs text-gray-500">Size: {locker.size}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                                                            statusColors[locker.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                                                        )}
                                                    >
                                                        <CheckCircle className="h-3 w-3" />
                                                        {locker.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                                                            locker.maintenanceStatus
                                                                ? maintenanceColors[locker.maintenanceStatus]
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        )}
                                                    >
                                                        <ShieldAlert className="h-3 w-3" />
                                                        {(locker.maintenanceStatus ?? 'NORMAL').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-gray-600">
                                                    {locker.availableCapacity !== undefined && locker.maxCapacity !== undefined
                                                        ? `${locker.availableCapacity}/${locker.maxCapacity}`
                                                        : locker.maxCapacity ?? '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!locationLockers.length && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                                                {isLoading ? (
                                                    <span className="inline-flex items-center gap-2 text-gray-500">
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading lockers...
                                                    </span>
                                                ) : (
                                                    'No lockers found for this location.'
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Active Reservations</h3>
                                <CalendarCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="mt-4 space-y-4">
                                {reservations.map((reservation) => (
                                    <div key={reservation.id} className="rounded-xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-900">Reservation #{reservation.id}</p>
                                                <p className="text-xs text-gray-500">{reservation.reservationType}</p>
                                            </div>
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                                {reservation.status}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <p>
                                                <span className="font-medium text-gray-500">User:</span> {reservation.userName || reservation.userId}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">Locker:</span> {reservation.lockerNumber || reservation.lockerId}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">From:</span> {formatDate(reservation.reservedFrom)}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">Until:</span> {formatDate(reservation.reservedUntil)}
                                            </p>
                                        </div>
                                        {reservation.notes && (
                                            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{reservation.notes}</p>
                                        )}
                                    </div>
                                ))}
                                {!reservations.length && (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                        No active reservations for this location.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Subscriptions</h3>
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="mt-4 space-y-4">
                                {subscriptions.map((subscription) => (
                                    <div key={subscription.id} className="rounded-xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{subscription.name || subscription.id}</p>
                                                {subscription.ownerName && (
                                                    <p className="text-xs text-gray-500">Owner: {subscription.ownerName}</p>
                                                )}
                                            </div>
                                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                                {subscription.status || 'ACTIVE'}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <p>
                                                <span className="font-medium text-gray-500">Lockers:</span> {subscription.lockerCount ?? '—'}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">Active reservations:</span> {subscription.activeReservations ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {!subscriptions.length && (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                        No subscription data available for this location.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Issues & Tasks</h3>
                                <button
                                    onClick={() => activeLocker && setIssueModalOpen(true)}
                                    disabled={!activeLocker}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Plus className="h-3 w-3" />
                                    New Issue
                                </button>
                            </div>
                            <div className="mt-4 space-y-4">
                                {issues.map((issue) => (
                                    <div key={issue.id} className="rounded-xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-900">{issue.title}</p>
                                                <p className="text-xs text-gray-500">Reported {formatDate(issue.reportedAt)}</p>
                                            </div>
                                            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                                                {issue.status}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm text-gray-600">{issue.description}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                                                Severity: {issue.severity}
                                            </span>
                                            {issue.assignedTo && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                                                    Assigned: {issue.assignedTo}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setIssueToUpdate(issue);
                                                    setUpdateIssueModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                            >
                                                <ClipboardList className="h-3 w-3" /> Update
                                            </button>
                                            <button
                                                onClick={() =>
                                                    addIssueComment(issue.id, issue.lockerId, {
                                                        comment: 'Followed up from locker operations workspace.',
                                                        isInternal: true,
                                                    })
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                            >
                                                <RefreshCw className="h-3 w-3" /> Log activity
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!issues.length && (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                        No issues reported for this locker.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Maintenance Timeline</h3>
                                <button
                                    onClick={() => activeLocker && setMaintenanceModalOpen(true)}
                                    disabled={!activeLocker}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Plus className="h-3 w-3" />
                                    Schedule
                                </button>
                            </div>
                            <div className="mt-4 space-y-4">
                                {maintenanceRecords.map((record) => (
                                    <div key={record.id} className="rounded-xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-900">{record.maintenanceType}</p>
                                                <p className="text-xs text-gray-500">Scheduled {formatDate(record.scheduledDate)}</p>
                                            </div>
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                                {record.status}
                                            </span>
                                        </div>
                                        {record.notes && (
                                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{record.notes}</p>
                                        )}
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <p>
                                                <span className="font-medium text-gray-500">Assigned:</span> {record.assignedTo}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">Estimated:</span> {record.estimatedDurationHours}h
                                            </p>
                                            {record.actualDurationHours !== undefined && record.actualDurationHours !== null && (
                                                <p>
                                                    <span className="font-medium text-gray-500">Actual:</span> {record.actualDurationHours}h
                                                </p>
                                            )}
                                            {record.totalCost !== undefined && record.totalCost !== null && (
                                                <p>
                                                    <span className="font-medium text-gray-500">Cost:</span> ${record.totalCost}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setMaintenanceToUpdate(record);
                                                    setUpdateMaintenanceModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                            >
                                                <ClipboardList className="h-3 w-3" /> Update
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!maintenanceRecords.length && (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                                        No maintenance history found for this locker.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <CreateLockerModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                locations={locations}
                subscriptions={subscriptions}
                defaultLocationId={selectedLocationId}
                onSubmit={createLocker}
            />
            <BulkCreateLockersModal
                isOpen={isBulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                locations={locations}
                subscriptions={subscriptions}
                defaultLocationId={selectedLocationId}
                onSubmit={bulkCreateLockers}
            />
            <UpdateLockerStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                locker={activeLocker ?? null}
                onSubmit={(payload) =>
                    activeLocker ? updateLockerStatus(activeLocker.id, payload) : Promise.resolve()
                }
            />
            <ReportIssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIssueModalOpen(false)}
                locker={activeLocker ?? null}
                onSubmit={async (payload) => {
                    if (!activeLocker) return;
                    await createIssue({ ...payload, lockerId: activeLocker.id });
                }}
            />
            <UpdateIssueModal
                isOpen={isUpdateIssueModalOpen}
                onClose={() => {
                    setUpdateIssueModalOpen(false);
                    setIssueToUpdate(null);
                }}
                issue={issueToUpdate}
                onSubmit={handleUpdateIssue}
            />
            <ScheduleMaintenanceModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setMaintenanceModalOpen(false)}
                locker={activeLocker ?? null}
                onSubmit={async (payload) => {
                    if (!activeLocker) return;
                    await scheduleMaintenance(activeLocker.id, payload);
                }}
            />
            <UpdateMaintenanceModal
                isOpen={isUpdateMaintenanceModalOpen}
                onClose={() => {
                    setUpdateMaintenanceModalOpen(false);
                    setMaintenanceToUpdate(null);
                }}
                maintenance={maintenanceToUpdate}
                onSubmit={handleUpdateMaintenance}
            />
            {(loadingLockerInsights || isLoading) && (
                <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Syncing latest locker data...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
