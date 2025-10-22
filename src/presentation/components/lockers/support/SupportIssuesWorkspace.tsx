'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverlay,
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
    Search,
    Filter,
    X,
    FileText,
    Wrench,
    AlertCircle,
    User,
    Calendar,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

import {
    LockerIssue,
    LockerIssueStatus,
    LockerMaintenanceRecord,
    LockerSummary,
    ResolveLockerIssuePayload,
    UpdateLockerIssuePayload,
} from '../../../../core/entities/lockers';
import { lockerSupportService, LockerIssueFilters } from '../../../../infrastructure/services/locker-support.service';
import { useToast } from '../../ui/toast';
import { cn } from '../../../../shared/utils/cn';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type SeverityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type SeverityFilterType = SeverityType | 'ALL';

interface SupportIssuesWorkspaceProps {
    token?: string | null;
}

interface BoardState {
    columns: Record<LockerIssueStatus, LockerIssue[]>;
}

interface IssueCardProps {
    issue: LockerIssue;
    isActive?: boolean;
    onSelect: (issue: LockerIssue) => void;
}

interface ColumnProps {
    column: {
        id: LockerIssueStatus;
        title: string;
        helper: string;
        icon: React.ComponentType<{ className?: string }>;
    };
    issues: LockerIssue[];
    onSelectIssue: (issue: LockerIssue) => void;
    activeIssueId: string | null;
}

interface MaintenancePanelProps {
    locker: LockerSummary | null;
    history: LockerMaintenanceRecord[];
    loading: boolean;
    onRefresh: () => void;
}

interface IssueDetailPanelProps {
    issue: LockerIssue;
    onUpdate: (payload: UpdateLockerIssuePayload) => Promise<void>;
    onResolve: (payload: ResolveLockerIssuePayload) => Promise<void>;
    loading: boolean;
}

interface ExtendedFilters {
    severity: SeverityFilterType;
    status?: LockerIssueStatus;
    issueType?: string;
}

interface FilterPanelProps {
    filters: ExtendedFilters;
    onFilterChange: (filters: ExtendedFilters) => void;
    totalIssues: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ISSUE_COLUMNS: Array<{
    id: LockerIssueStatus;
    title: string;
    helper: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
    {
        id: 'OPEN',
        title: 'Open',
        helper: 'New issues awaiting triage',
        icon: AlertCircle,
    },
    {
        id: 'IN_PROGRESS',
        title: 'In Progress',
        helper: 'Technicians actively working',
        icon: Wrench,
    },
    {
        id: 'RESOLVED',
        title: 'Resolved',
        helper: 'Awaiting verification and locker reset',
        icon: CheckCircle2,
    },
    {
        id: 'CLOSED',
        title: 'Closed',
        helper: 'Fully verified and communicated',
        icon: FileText,
    },
];

const SEVERITY_CONFIG: Record<
    SeverityType,
    {
        label: string;
        className: string;
        bgClassName: string;
    }
> = {
    LOW: {
        label: 'Low',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        bgClassName: 'bg-emerald-500',
    },
    MEDIUM: {
        label: 'Medium',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        bgClassName: 'bg-amber-500',
    },
    HIGH: {
        label: 'High',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
        bgClassName: 'bg-orange-500',
    },
    CRITICAL: {
        label: 'Critical',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        bgClassName: 'bg-rose-500',
    },
};

const STATUS_BACKGROUND: Record<LockerIssueStatus, string> = {
    OPEN: 'bg-slate-50 border-slate-200',
    IN_PROGRESS: 'bg-blue-50 border-blue-200',
    RESOLVED: 'bg-emerald-50 border-emerald-200',
    CLOSED: 'bg-gray-50 border-gray-200',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function groupIssuesByStatus(issues: LockerIssue[]): BoardState {
    const columns: Record<LockerIssueStatus, LockerIssue[]> = {
        OPEN: [],
        IN_PROGRESS: [],
        RESOLVED: [],
        CLOSED: [],
    };

    issues.forEach((issue) => {
        if (columns[issue.status]) {
            columns[issue.status].push(issue);
        }
    });

    return { columns };
}

function applyFilters(
    issues: LockerIssue[],
    filters: ExtendedFilters
): LockerIssue[] {
    let filtered = [...issues];

    if (filters.status) {
        filtered = filtered.filter((issue) => issue.status === filters.status);
    }

    if (filters.severity && filters.severity !== 'ALL') {
        filtered = filtered.filter((issue) => issue.severity === filters.severity);
    }

    if (filters.issueType) {
        filtered = filtered.filter((issue) => issue.issueType === filters.issueType);
    }

    return filtered;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function IssueCard({ issue, isActive, onSelect }: IssueCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: issue.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group rounded-lg border bg-white p-4 shadow-sm transition-all cursor-grab active:cursor-grabbing',
                'hover:shadow-md hover:border-blue-300',
                isDragging && 'ring-2 ring-blue-500 shadow-lg opacity-50',
                isActive && 'ring-2 ring-blue-400 border-blue-400'
            )}
            onClick={() => onSelect(issue)}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {issue.title}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                        Locker <span className="font-medium">{issue.lockerCode}</span>
                    </p>
                </div>
                <span
                    className={cn(
                        'flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        SEVERITY_CONFIG[issue.severity]?.className ||
                        'bg-gray-50 text-gray-700'
                    )}
                >
                    {issue.severity}
                </span>
            </div>

            <p className="mt-2 text-xs text-gray-600 line-clamp-2">{issue.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {issue.assignedTo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{issue.assignedTo}</span>
                    </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                    <Clock className="h-3 w-3" />
                    {new Date(issue.reportedAt).toLocaleDateString()}
                </span>
                {issue.estimatedResolutionTime && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] text-orange-700">
                        <Calendar className="h-3 w-3" />
                        ETA {new Date(issue.estimatedResolutionTime).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
}

function Column({ column, issues, onSelectIssue, activeIssueId }: ColumnProps) {
    const Icon = column.icon;

    return (
        <div
            className={cn(
                'flex h-full flex-col rounded-xl border-2 transition-colors',
                STATUS_BACKGROUND[column.id]
            )}
        >
            <div className="flex items-center justify-between border-b bg-white/50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-900">{column.title}</h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {issues.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <SortableContext items={issues.map((i) => i.id)} strategy={rectSortingStrategy}>
                    <div className="space-y-3">
                        {issues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Icon className="h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-xs text-gray-500">{column.helper}</p>
                            </div>
                        ) : (
                            issues.map((issue) => (
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    isActive={activeIssueId === issue.id}
                                    onSelect={onSelectIssue}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

function FilterPanel({ filters, onFilterChange, totalIssues }: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Filters</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {totalIssues} issues
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100 p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Severity
                            </label>
                            <select
                                value={filters.severity}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        severity: e.target.value as SeverityFilterType
                                    })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="ALL">All Severities</option>
                                {(Object.keys(SEVERITY_CONFIG) as SeverityType[]).map((key) => (
                                    <option key={key} value={key}>
                                        {SEVERITY_CONFIG[key].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Status
                            </label>
                            <select
                                value={filters.status || 'ALL'}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        status:
                                            e.target.value === 'ALL'
                                                ? undefined
                                                : (e.target.value as LockerIssueStatus),
                                    })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="ALL">All Statuses</option>
                                {ISSUE_COLUMNS.map((col) => (
                                    <option key={col.id} value={col.id}>
                                        {col.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Issue Type
                            </label>
                            <input
                                type="text"
                                value={filters.issueType || ''}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        issueType: e.target.value || undefined,
                                    })
                                }
                                placeholder="Filter by type..."
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {(filters.severity !== 'ALL' ||
                        filters.status ||
                        filters.issueType) && (
                        <button
                            onClick={() =>
                                onFilterChange({
                                    severity: 'ALL',
                                    status: undefined,
                                    issueType: undefined,
                                })
                            }
                            className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            <X className="h-3 w-3" />
                            Clear all filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function IssueDetailPanel({
                              issue,
                              onUpdate,
                              onResolve,
                              loading,
                          }: IssueDetailPanelProps) {
    const [formData, setFormData] = useState({
        assignedTo: issue.assignedTo || '',
        estimatedResolutionTime: issue.estimatedResolutionTime?.slice(0, 16) || '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onUpdate({
            assignedTo: formData.assignedTo || null,
            estimatedResolutionTime: formData.estimatedResolutionTime || null,
            notes: formData.notes || undefined,
        });
    };

    const handleResolve = async () => {
        const resolutionNotes = prompt(
            'Enter resolution notes for this issue (required):'
        );
        if (!resolutionNotes?.trim()) {
            return;
        }
        await onResolve({
            resolutionNotes: resolutionNotes.trim(),
            makeLockerAvailable: true,
        });
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Issue Details
                        </span>
                        <span
                            className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                                SEVERITY_CONFIG[issue.severity]?.className
                            )}
                        >
                            {issue.severity}
                        </span>
                    </div>
                    <h3 className="mt-1 text-xl font-bold text-gray-900">{issue.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            Locker {issue.lockerCode}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            Reported {new Date(issue.reportedAt).toLocaleString()}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            ID: {issue.id.slice(0, 8)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Description
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            {issue.description}
                        </p>
                    </div>

                    {issue.attachments && issue.attachments.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Attachments
                            </p>
                            <ul className="mt-2 space-y-1">
                                {issue.attachments.map((attachment, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={attachment}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            📎 {attachment.split('/').pop()}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {issue.statusHistory && issue.statusHistory.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Status History
                            </p>
                            <div className="mt-2 space-y-2">
                                {issue.statusHistory.slice(0, 3).map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-gray-800">
                                                {entry.status}
                                            </span>
                                            <span className="text-gray-500">
                                                {new Date(entry.changedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {entry.notes && (
                                            <p className="mt-1 text-xs text-gray-600">
                                                {entry.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Assigned To
                            </label>
                            <input
                                type="text"
                                value={formData.assignedTo}
                                onChange={(e) =>
                                    setFormData({ ...formData, assignedTo: e.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Technician name or team"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Estimated Resolution Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.estimatedResolutionTime}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        estimatedResolutionTime: e.target.value,
                                    })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Progress Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                placeholder="Add update notes..."
                                rows={4}
                                className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Update Issue
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleResolve}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Resolve Issue
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function MaintenancePanel({
                              locker,
                              history,
                              loading,
                              onRefresh,
                          }: MaintenancePanelProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-900">Maintenance History</h3>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading || !locker}
                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </button>
            </div>

            {!locker ? (
                <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                    Select a locker to view maintenance history
                </div>
            ) : loading ? (
                <div className="mt-4 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : history.length === 0 ? (
                <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                    No maintenance records found
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    {history.slice(0, 5).map((record) => (
                        <div
                            key={record.id}
                            className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {record.maintenanceType}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Status: <span className="font-medium">{record.status}</span>
                                    </p>
                                </div>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    {new Date(record.scheduledDate).toLocaleDateString()}
                                </span>
                            </div>
                            {record.findings && (
                                <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                                    {record.findings}
                                </p>
                            )}
                            {record.completedAt && (
                                <p className="mt-2 text-xs text-emerald-600">
                                    ✓ Completed{' '}
                                    {new Date(record.completedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SupportIssuesWorkspace({ token }: SupportIssuesWorkspaceProps) {
    const { pushToast } = useToast();

    // State
    const [lockers, setLockers] = useState<LockerSummary[]>([]);
    const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);
    const [allIssues, setAllIssues] = useState<LockerIssue[]>([]);
    const [boardState, setBoardState] = useState<BoardState>({
        columns: { OPEN: [], IN_PROGRESS: [], RESOLVED: [], CLOSED: [] },
    });
    const [activeIssue, setActiveIssue] = useState<LockerIssue | null>(null);
    const [draggedIssue, setDraggedIssue] = useState<LockerIssue | null>(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState<
        LockerMaintenanceRecord[]
    >([]);
    const [filters, setFilters] = useState<ExtendedFilters>({
        severity: 'ALL',
    });

    // Loading states
    const [loadingLockers, setLoadingLockers] = useState(false);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [loadingMaintenance, setLoadingMaintenance] = useState(false);
    const [updatingIssue, setUpdatingIssue] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // Computed values
    const selectedLocker = useMemo(
        () => lockers.find((l) => l.id === selectedLockerId) ?? null,
        [lockers, selectedLockerId]
    );

    const filteredIssues = useMemo(
        () => applyFilters(allIssues, filters),
        [allIssues, filters]
    );

    // ========================================================================
    // API CALLS
    // ========================================================================

    const loadLockers = useCallback(async () => {
        if (!token) return;

        setLoadingLockers(true);
        try {
            const response = await lockerSupportService.listOutOfServiceLockers(
                { size: 100 },
                token
            );

            setLockers(response.data.lockers);

            if (response.data.lockers.length === 0) {
                pushToast({
                    type: 'success',
                    title: 'All Clear',
                    description: 'No lockers require support attention.',
                });
            } else if (!selectedLockerId && response.data.lockers.length > 0) {
                setSelectedLockerId(response.data.lockers[0].id);
            }
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Failed to Load Lockers',
                description:
                    error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setLoadingLockers(false);
        }
    }, [token, pushToast, selectedLockerId]);

    const loadIssues = useCallback(
        async (lockerId: string) => {
            if (!token) return;

            setLoadingIssues(true);
            try {
                const response = await lockerSupportService.getLockerIssues(
                    lockerId,
                    {},
                    token
                );

                setAllIssues(response.data);
                setBoardState(groupIssuesByStatus(response.data));

                pushToast({
                    type: 'info',
                    title: 'Issues Loaded',
                    description: `Found ${response.data.length} issue(s) for this locker.`,
                });
            } catch (error) {
                pushToast({
                    type: 'error',
                    title: 'Failed to Load Issues',
                    description:
                        error instanceof Error ? error.message : 'An unknown error occurred',
                });
            } finally {
                setLoadingIssues(false);
            }
        },
        [token, pushToast]
    );

    const loadMaintenanceHistory = useCallback(
        async (lockerId: string) => {
            if (!token) return;

            setLoadingMaintenance(true);
            try {
                const response = await lockerSupportService.getMaintenanceHistory(
                    lockerId,
                    token
                );
                setMaintenanceHistory(response.data);
            } catch (error) {
                console.error('Failed to load maintenance history:', error);
                setMaintenanceHistory([]);
            } finally {
                setLoadingMaintenance(false);
            }
        },
        [token]
    );

    const handleUpdateIssue = useCallback(
        async (payload: UpdateLockerIssuePayload) => {
            if (!activeIssue || !token) return;

            setUpdatingIssue(true);
            try {
                const response = await lockerSupportService.updateIssue(
                    activeIssue.id,
                    payload,
                    token
                );

                // Update local state
                setAllIssues((prev) =>
                    prev.map((issue) =>
                        issue.id === response.data.id ? response.data : issue
                    )
                );
                setBoardState(
                    groupIssuesByStatus(
                        allIssues.map((issue) =>
                            issue.id === response.data.id ? response.data : issue
                        )
                    )
                );
                setActiveIssue(response.data);

                pushToast({
                    type: 'success',
                    title: 'Issue Updated',
                    description: 'Issue details have been successfully updated.',
                });
            } catch (error) {
                pushToast({
                    type: 'error',
                    title: 'Update Failed',
                    description:
                        error instanceof Error ? error.message : 'An unknown error occurred',
                });
            } finally {
                setUpdatingIssue(false);
            }
        },
        [activeIssue, token, allIssues, pushToast]
    );

    const handleResolveIssue = useCallback(
        async (payload: ResolveLockerIssuePayload) => {
            if (!activeIssue || !token) return;

            setUpdatingIssue(true);
            try {
                await lockerSupportService.resolveIssue(activeIssue.id, payload, token);

                // Reload issues after resolution
                if (selectedLockerId) {
                    await loadIssues(selectedLockerId);
                }

                setActiveIssue(null);

                pushToast({
                    type: 'success',
                    title: 'Issue Resolved',
                    description: 'Issue has been resolved and locker is now available.',
                });
            } catch (error) {
                pushToast({
                    type: 'error',
                    title: 'Resolution Failed',
                    description:
                        error instanceof Error ? error.message : 'An unknown error occurred',
                });
            } finally {
                setUpdatingIssue(false);
            }
        },
        [activeIssue, token, selectedLockerId, loadIssues, pushToast]
    );

    // ========================================================================
    // DRAG & DROP HANDLERS
    // ========================================================================

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const issue = Object.values(boardState.columns)
            .flat()
            .find((i) => i.id === active.id);
        if (issue) {
            setDraggedIssue(issue);
        }
    }, [boardState.columns]);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setDraggedIssue(null);

            if (!over || !token) return;

            const issueId = active.id as string;
            const newStatus = over.id as LockerIssueStatus;

            // Find the issue being dragged
            const issue = Object.values(boardState.columns)
                .flat()
                .find((i) => i.id === issueId);

            if (!issue || issue.status === newStatus) return;

            // Optimistically update UI
            const oldStatus = issue.status;
            const updatedIssue = { ...issue, status: newStatus };

            setBoardState((prev) => {
                const newColumns = { ...prev.columns };
                newColumns[oldStatus] = newColumns[oldStatus].filter((i) => i.id !== issueId);
                newColumns[newStatus] = [...newColumns[newStatus], updatedIssue];
                return { columns: newColumns };
            });

            // Update on server
            try {
                const response = await lockerSupportService.updateIssue(
                    issueId,
                    { status: newStatus },
                    token
                );

                // Update with server response
                setAllIssues((prev) =>
                    prev.map((i) => (i.id === response.data.id ? response.data : i))
                );

                pushToast({
                    type: 'success',
                    title: 'Status Updated',
                    description: `Moved to ${newStatus.replace('_', ' ').toLowerCase()}.`,
                });
            } catch (error) {
                // Revert on error
                setBoardState(groupIssuesByStatus(allIssues));
                pushToast({
                    type: 'error',
                    title: 'Update Failed',
                    description:
                        error instanceof Error ? error.message : 'Failed to update status',
                });
            }
        },
        [boardState.columns, token, allIssues, pushToast]
    );

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useEffect(() => {
        if (token) {
            loadLockers();
        }
    }, [token, loadLockers]);

    useEffect(() => {
        if (selectedLockerId && token) {
            loadIssues(selectedLockerId);
            loadMaintenanceHistory(selectedLockerId);
        }
    }, [selectedLockerId, token, loadIssues, loadMaintenanceHistory]);

    useEffect(() => {
        setBoardState(groupIssuesByStatus(filteredIssues));
    }, [filteredIssues]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Support Command Center
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage locker issues and maintenance operations
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setActiveIssue(null);
                            setFilters({ severity: 'ALL' });
                            if (selectedLockerId) {
                                loadIssues(selectedLockerId);
                                loadMaintenanceHistory(selectedLockerId);
                            }
                        }}
                        disabled={loadingIssues}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadingIssues ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh Data
                    </button>
                    <button
                        onClick={loadLockers}
                        disabled={loadingLockers}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadingLockers ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Scan Lockers
                    </button>
                </div>
            </div>

            {/* Locker Selector */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Select Locker
                </label>
                <select
                    value={selectedLockerId || ''}
                    onChange={(e) => {
                        setSelectedLockerId(e.target.value || null);
                        setActiveIssue(null);
                    }}
                    disabled={lockers.length === 0}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {lockers.length === 0 ? (
                        <option value="">No lockers requiring support</option>
                    ) : (
                        lockers.map((locker) => (
                            <option key={locker.id} value={locker.id}>
                                {locker.code} - {locker.lockerNumber} (
                                {locker.locationName || 'Unknown Location'})
                            </option>
                        ))
                    )}
                </select>
            </div>

            {/* Filters */}
            <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                totalIssues={filteredIssues.length}
            />

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    {ISSUE_COLUMNS.map((column) => (
                        <SortableContext
                            key={column.id}
                            id={column.id}
                            items={boardState.columns[column.id].map((i) => i.id)}
                            strategy={rectSortingStrategy}
                        >
                            <Column
                                column={column}
                                issues={boardState.columns[column.id]}
                                onSelectIssue={setActiveIssue}
                                activeIssueId={activeIssue?.id || null}
                            />
                        </SortableContext>
                    ))}
                </div>

                <DragOverlay>
                    {draggedIssue && (
                        <div className="rounded-lg border-2 border-blue-500 bg-white p-4 shadow-2xl">
                            <p className="text-sm font-semibold">{draggedIssue.title}</p>
                            <p className="mt-1 text-xs text-gray-500">
                                Locker {draggedIssue.lockerCode}
                            </p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Issue Detail Panel */}
            {activeIssue && (
                <IssueDetailPanel
                    issue={activeIssue}
                    onUpdate={handleUpdateIssue}
                    onResolve={handleResolveIssue}
                    loading={updatingIssue}
                />
            )}

            {/* Maintenance History */}
            <MaintenancePanel
                locker={selectedLocker}
                history={maintenanceHistory}
                loading={loadingMaintenance}
                onRefresh={() => {
                    if (selectedLockerId) {
                        loadMaintenanceHistory(selectedLockerId);
                    }
                }}
            />

            {/* Info Banner */}
            {selectedLocker && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold">
                                Monitoring {selectedLocker.code} at{' '}
                                {selectedLocker.locationName || 'Unknown Location'}
                            </p>
                            <p className="mt-1 text-blue-700">
                                Drag issue cards between columns to update status. All changes are
                                synced with the backend API in real-time.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SupportIssuesWorkspace;