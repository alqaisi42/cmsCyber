'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Info,
    Loader2,
    RefreshCw,
} from 'lucide-react';

import {
    LockerIssue,
    LockerIssueStatus,
    LockerMaintenanceRecord,
    LockerSummary,
    ResolveLockerIssuePayload,
    UpdateLockerIssuePayload,
} from '../../../../core/entities/lockers';
import { lockerSupportService } from '../../../../infrastructure/services/locker-support.service';
import { useToast } from '../../ui/toast';
import { cn } from '../../../../shared/utils/cn';

interface SupportIssuesWorkspaceProps {
    token?: string | null;
}

interface BoardState {
    columns: Record<LockerIssueStatus, LockerIssue[]>;
}

const ISSUE_COLUMNS: Array<{
    id: LockerIssueStatus;
    title: string;
    helper: string;
}> = [
    { id: 'OPEN', title: 'Open', helper: 'New issues awaiting triage' },
    { id: 'IN_PROGRESS', title: 'In progress', helper: 'Technicians actively working' },
    { id: 'RESOLVED', title: 'Resolved', helper: 'Awaiting verification and locker reset' },
    { id: 'CLOSED', title: 'Closed', helper: 'Fully verified and communicated' },
];

const API_REFERENCE = [
    {
        method: 'GET',
        path: '/api/v1/admin/lockers?status=OUT_OF_SERVICE',
        description: 'Retrieve lockers that require support attention.',
    },
    {
        method: 'GET',
        path: '/api/v1/admin/lockers/{lockerId}/issues',
        description: 'Fetch outstanding issues for a specific locker.',
    },
    {
        method: 'PATCH',
        path: '/api/v1/admin/lockers/issues/{issueId}',
        description: 'Update status, assignment, or ETA for an issue card.',
    },
    {
        method: 'POST',
        path: '/api/v1/admin/lockers/issues/{issueId}/resolve',
        description: 'Confirm resolution details and reopen locker capacity.',
    },
    {
        method: 'GET',
        path: '/api/v1/admin/lockers/{lockerId}/maintenance/history',
        description: 'Audit previous interventions before planning the next step.',
    },
];

const severityAccent: Record<string, string> = {
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusBackground: Record<LockerIssueStatus, string> = {
    OPEN: 'bg-slate-50',
    IN_PROGRESS: 'bg-blue-50',
    RESOLVED: 'bg-emerald-50',
    CLOSED: 'bg-gray-50',
};

function groupIssuesByStatus(issues: LockerIssue[]): BoardState {
    const columns: Record<LockerIssueStatus, LockerIssue[]> = {
        OPEN: [],
        IN_PROGRESS: [],
        RESOLVED: [],
        CLOSED: [],
    };

    issues.forEach((issue) => {
        columns[issue.status] = [...columns[issue.status], issue];
    });

    return { columns };
}

function IssueCard({ issue }: { issue: LockerIssue }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'rounded-lg border bg-white p-4 shadow-sm transition-shadow cursor-grab focus:outline-none',
                isDragging && 'ring-2 ring-blue-500 shadow-lg'
            )}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-gray-900">{issue.title}</p>
                    <p className="mt-1 text-xs text-gray-500">Locker {issue.lockerCode}</p>
                </div>
                <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold uppercase', severityAccent[issue.severity])}>
                    {issue.severity}
                </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 line-clamp-3">{issue.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {issue.assignedTo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                        <Info className="h-3 w-3" /> {issue.assignedTo}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(issue.reportedAt).toLocaleString()}
                </span>
            </div>
        </div>
    );
}

function ApiReference() {
    return (
        <div className="space-y-4 rounded-xl border border-dashed border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Info className="h-4 w-4 text-blue-500" />
                API flow used by the workspace
            </div>
            <ul className="space-y-3">
                {API_REFERENCE.map((entry) => (
                    <li key={entry.path} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span
                                className={cn(
                                    'rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                                    entry.method === 'GET'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : entry.method === 'POST'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-amber-50 text-amber-700'
                                )}
                            >
                                {entry.method}
                            </span>
                            <code className="font-mono text-xs text-slate-600">{entry.path}</code>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function SupportIssuesWorkspace({ token }: SupportIssuesWorkspaceProps) {
    const { pushToast } = useToast();
    const [lockers, setLockers] = useState<LockerSummary[]>([]);
    const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);
    const [boardState, setBoardState] = useState<BoardState>(() => ({ columns: { OPEN: [], IN_PROGRESS: [], RESOLVED: [], CLOSED: [] } }));
    const [activeIssue, setActiveIssue] = useState<LockerIssue | null>(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState<LockerMaintenanceRecord[]>([]);
    const [loadingLockers, setLoadingLockers] = useState(false);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [updatingIssue, setUpdatingIssue] = useState(false);
    const [filters, setFilters] = useState<{ severity: string; status: LockerIssueStatus | 'ALL' }>({ severity: 'ALL', status: 'ALL' });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const issuesForLocker = useMemo(() => {
        if (!activeIssue) {
            return null;
        }
        return boardState.columns[activeIssue.status].find((issue) => issue.id === activeIssue.id) ?? activeIssue;
    }, [activeIssue, boardState.columns]);

    const selectedLocker = useMemo(() => lockers.find((locker) => locker.id === selectedLockerId) ?? null, [lockers, selectedLockerId]);

    const loadLockers = async () => {
        if (!token) {
            return;
        }
        setLoadingLockers(true);
        try {
            const response = await lockerSupportService.listOutOfServiceLockers({ size: 50 }, token);
            setLockers(response.data.lockers);
            if (!response.data.lockers.length) {
                pushToast({
                    type: 'info',
                    title: 'No lockers out of service',
                    description: 'Great news! All lockers are operational.',
                });
            } else if (!selectedLockerId) {
                setSelectedLockerId(response.data.lockers[0].id);
            }
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Unable to load lockers',
                description: error instanceof Error ? error.message : 'Could not retrieve out-of-service lockers.',
            });
        } finally {
            setLoadingLockers(false);
        }
    };

    const loadMaintenanceHistory = async (lockerId: string) => {
        if (!token) {
            return;
        }
        try {
            const history = await lockerSupportService.getMaintenanceHistory(lockerId, token);
            setMaintenanceHistory(history.data);
        } catch (error) {
            pushToast({
                type: 'warning',
                title: 'Maintenance history unavailable',
                description: error instanceof Error ? error.message : 'Unable to fetch maintenance history for this locker.',
            });
        }
    };

    const loadIssues = async (lockerId: string, showToast = false) => {
        if (!token) {
            return;
        }
        setLoadingIssues(true);
        try {
            const response = await lockerSupportService.getLockerIssues(lockerId, {
                severity: filters.severity === 'ALL' ? undefined : (filters.severity as LockerIssue['severity']),
                status: filters.status === 'ALL' ? undefined : filters.status,
            }, token);
            const { columns } = groupIssuesByStatus(response.data);
            setBoardState({ columns });
            setActiveIssue((current) => (current ? response.data.find((issue) => issue.id === current.id) ?? null : null));
            if (showToast) {
                pushToast({ type: 'success', title: 'Support data refreshed', description: response.message });
            }
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Unable to load issues',
                description: error instanceof Error ? error.message : 'Could not retrieve issues for this locker.',
            });
        } finally {
            setLoadingIssues(false);
        }
    };

    useEffect(() => {
        loadLockers();
    }, [token]);

    useEffect(() => {
        if (selectedLockerId) {
            loadIssues(selectedLockerId);
            loadMaintenanceHistory(selectedLockerId);
        }
    }, [selectedLockerId]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !selectedLockerId) {
            return;
        }
        const issueId = active.id.toString();
        const sourceColumnId = ISSUE_COLUMNS.find((column) => boardState.columns[column.id].some((issue) => issue.id === issueId))?.id;
        const targetColumnId = ISSUE_COLUMNS.find((column) => column.id === over.id)?.id;
        if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) {
            return;
        }

        setBoardState((prev) => {
            const sourceItems = prev.columns[sourceColumnId].filter((issue) => issue.id !== issueId);
            const movedIssue = prev.columns[sourceColumnId].find((issue) => issue.id === issueId);
            if (!movedIssue) {
                return prev;
            }
            const destinationItems = [...prev.columns[targetColumnId], { ...movedIssue, status: targetColumnId }];
            return {
                columns: {
                    ...prev.columns,
                    [sourceColumnId]: sourceItems,
                    [targetColumnId]: destinationItems,
                },
            };
        });

        try {
            await lockerSupportService.updateIssue(
                issueId,
                { status: targetColumnId, notes: 'Status updated from board view.' },
                token ?? undefined
            );
            pushToast({ type: 'success', title: 'Issue status updated', description: `Moved to ${targetColumnId}.` });
            loadIssues(selectedLockerId);
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Failed to update issue',
                description: error instanceof Error ? error.message : 'Drag action reverted.',
            });
            loadIssues(selectedLockerId);
        }
    };

    const handleIssueSelect = (issue: LockerIssue) => {
        setActiveIssue(issue);
    };

    const handleIssueUpdate = async (payload: UpdateLockerIssuePayload) => {
        if (!activeIssue) {
            return;
        }
        setUpdatingIssue(true);
        try {
            const response = await lockerSupportService.updateIssue(activeIssue.id, payload, token ?? undefined);
            pushToast({
                type: 'success',
                title: 'Issue updated',
                description: response.message || 'Issue details saved.',
            });
            setActiveIssue(response.data);
            if (selectedLockerId) {
                loadIssues(selectedLockerId);
            }
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Update failed',
                description: error instanceof Error ? error.message : 'Unable to update the issue details.',
            });
        } finally {
            setUpdatingIssue(false);
        }
    };

    const handleResolveIssue = async (payload: ResolveLockerIssuePayload) => {
        if (!activeIssue) {
            return;
        }
        setUpdatingIssue(true);
        try {
            const response = await lockerSupportService.resolveIssue(activeIssue.id, payload, token ?? undefined);
            pushToast({
                type: 'success',
                title: 'Issue resolved',
                description: response.message || 'Locker marked as available after resolution.',
            });
            if (selectedLockerId) {
                await loadIssues(selectedLockerId, true);
            }
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Resolution failed',
                description: error instanceof Error ? error.message : 'Unable to resolve the issue right now.',
            });
        } finally {
            setUpdatingIssue(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                            <AlertTriangle className="h-4 w-4" />
                            Locker Support Command Center
                        </div>
                        <h2 className="mt-1 text-2xl font-bold text-gray-900">Issues &amp; Tasks Workspace</h2>
                        <p className="text-sm text-gray-500">
                            Drag incidents across statuses, assign owners, and review maintenance context without leaving the dashboard.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => {
                                if (selectedLockerId) {
                                    loadIssues(selectedLockerId, true);
                                }
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                            disabled={loadingIssues}
                        >
                            {loadingIssues ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Reset &amp; reload API data
                        </button>
                        <button
                            onClick={loadLockers}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                            disabled={loadingLockers}
                        >
                            {loadingLockers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh lockers
                        </button>
                    </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Locker</label>
                        <select
                            value={selectedLockerId ?? ''}
                            onChange={(event) => setSelectedLockerId(event.target.value || null)}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {!lockers.length && <option value="">No lockers needing support</option>}
                            {lockers.map((locker) => (
                                <option key={locker.id} value={locker.id}>
                                    {locker.code} · {locker.locationName ?? 'Unknown location'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Severity</label>
                        <select
                            value={filters.severity}
                            onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((option) => (
                                <option key={option} value={option}>
                                    {option === 'ALL' ? 'All severities' : option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                        <select
                            value={filters.status}
                            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as LockerIssueStatus | 'ALL' }))}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {['ALL', ...ISSUE_COLUMNS.map((column) => column.id)].map((option) => (
                                <option key={option} value={option}>
                                    {option === 'ALL' ? 'All statuses' : option.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {ISSUE_COLUMNS.map((column) => {
                                    const columnIssues = boardState.columns[column.id];
                                    return (
                                        <div key={column.id} className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{column.title}</p>
                                                    <p className="text-xs text-gray-500">{column.helper}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-400">{columnIssues.length}</span>
                                            </div>
                                            <SortableContext items={columnIssues.map((issue) => issue.id)} strategy={rectSortingStrategy}>
                                                <div className={cn('flex flex-1 flex-col gap-3 rounded-lg border border-dashed border-gray-200 p-2', statusBackground[column.id])} id={column.id}>
                                                    {loadingIssues && columnIssues.length === 0 ? (
                                                        <div className="flex flex-1 items-center justify-center text-xs text-gray-500">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading issues
                                                        </div>
                                                    ) : columnIssues.length === 0 ? (
                                                        <div className="flex flex-1 items-center justify-center text-xs text-gray-500">
                                                            No issues in this state
                                                        </div>
                                                    ) : (
                                                        columnIssues.map((issue) => (
                                                            <button
                                                                key={issue.id}
                                                                type="button"
                                                                className="text-left"
                                                                onClick={() => handleIssueSelect(issue)}
                                                            >
                                                                <IssueCard issue={issue} />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </SortableContext>
                                        </div>
                                    );
                                })}
                            </div>
                        </DndContext>
                    </div>
                </div>
                <div className="space-y-6">
                    <ApiReference />
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Latest maintenance history
                        </div>
                        {maintenanceHistory.length === 0 ? (
                            <p className="mt-2 text-xs text-gray-500">No maintenance records returned by the API for this locker yet.</p>
                        ) : (
                            <ul className="mt-3 space-y-3 text-xs text-gray-600">
                                {maintenanceHistory.slice(0, 4).map((record) => (
                                    <li key={record.id} className="rounded-lg border border-gray-100 p-3">
                                        <p className="font-semibold text-gray-800">{record.maintenanceType} · {record.status}</p>
                                        <p className="mt-1 text-gray-500">
                                            Scheduled {new Date(record.scheduledDate).toLocaleString()}
                                            {record.completedAt && ` · Completed ${new Date(record.completedAt).toLocaleString()}`}
                                        </p>
                                        {record.findings && <p className="mt-1 line-clamp-2 text-gray-500">{record.findings}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {activeIssue && issuesForLocker && (
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                ISSUE · {activeIssue.id}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{activeIssue.title}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className={cn('rounded-full border px-2 py-0.5 font-semibold uppercase', severityAccent[activeIssue.severity])}>
                                    {activeIssue.severity}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5">Locker {activeIssue.lockerCode}</span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5">Reported {new Date(activeIssue.reportedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
                                <p className="mt-1 text-sm leading-relaxed text-gray-700">{activeIssue.description}</p>
                            </div>
                            {activeIssue.attachments && activeIssue.attachments.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attachments</p>
                                    <ul className="mt-1 space-y-1 text-sm text-blue-600">
                                        {activeIssue.attachments.map((attachment) => (
                                            <li key={attachment}>
                                                <a href={attachment} target="_blank" rel="noreferrer" className="hover:underline">
                                                    {attachment.split('/').pop()}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {activeIssue.statusHistory && activeIssue.statusHistory.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status history</p>
                                    <ul className="mt-1 space-y-2 text-xs text-gray-600">
                                        {activeIssue.statusHistory.slice(0, 4).map((entry) => (
                                            <li key={`${entry.status}-${entry.changedAt}`} className="rounded-lg border border-gray-100 p-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-800">{entry.status}</span>
                                                    <span>{new Date(entry.changedAt).toLocaleString()}</span>
                                                </div>
                                                <p className="mt-1 text-gray-500">{entry.notes || 'No notes recorded.'}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const formData = new FormData(event.currentTarget);
                                    handleIssueUpdate({
                                        assignedTo: (formData.get('assignedTo') as string) || null,
                                        estimatedResolutionTime: (formData.get('eta') as string) || null,
                                        notes: (formData.get('notes') as string) || undefined,
                                    });
                                }}
                                className="space-y-3"
                            >
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned to</label>
                                    <input
                                        name="assignedTo"
                                        defaultValue={activeIssue.assignedTo ?? ''}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Maintenance crew or engineer"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estimated resolution time</label>
                                    <input
                                        type="datetime-local"
                                        name="eta"
                                        defaultValue={activeIssue.estimatedResolutionTime?.slice(0, 16) ?? ''}
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</label>
                                    <textarea
                                        name="notes"
                                        defaultValue=""
                                        placeholder="Add progress or context notes"
                                        className="mt-1 h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="submit"
                                        disabled={updatingIssue}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {updatingIssue ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Save updates
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updatingIssue}
                                        onClick={() => {
                                            const resolutionNotes = prompt('Add resolution notes for this issue');
                                            if (!resolutionNotes) {
                                                return;
                                            }
                                            handleResolveIssue({ resolutionNotes, makeLockerAvailable: true });
                                        }}
                                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Resolve &amp; reopen locker
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {selectedLocker && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                    Monitoring <strong>{selectedLocker.code}</strong> at <strong>{selectedLocker.locationName ?? 'unknown location'}</strong>. Drag cards to update status or use the form to assign technicians. All interactions surface toast feedback tied to the API responses.
                </div>
            )}
        </div>
    );
}

export default SupportIssuesWorkspace;
