// src/presentation/components/lockers/LockerSupportWorkspace.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    AlertCircle,
    RefreshCw,
    Filter,
    Search,
    Plus,
    BarChart3,
    Clock,
    CheckCircle,
    X as CloseIcon,
} from 'lucide-react';
import { LockerIssue, LockerIssueStatus } from '@/core/entities';
import { IssueKanbanBoard } from './IssueKanbanBoard';
import { IssueDetailPanel } from './IssueDetailPanel';

import { cn } from '@/shared/utils/cn';
import MaintenanceHistoryPanel from "@/presentation/components/lockers/MaintenanceHistoryPanel";
import CreateIssueModal from "@/presentation/components/lockers/CreateIssueModal";

// ==========================================
// TYPES
// ==========================================

interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

// ==========================================
// COMPONENT
// ==========================================

export function LockerSupportWorkspace() {
    // State
    const [selectedIssue, setSelectedIssue] = useState<LockerIssue | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [filterStatus, setFilterStatus] = useState<LockerIssueStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMaintenancePanel, setShowMaintenancePanel] = useState(false);
    const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);

    // Hooks
    const { issues, loading, error, refetch, updateIssue, resolveIssue } = useAllOpenIssues();
    const { records: maintenanceRecords, refetch: refetchMaintenance } =
        useMaintenanceHistory(selectedLockerId);

    // Filter issues
    const filteredIssues = issues.filter((issue) => {
        const matchesStatus = filterStatus === 'ALL' || issue.status === filterStatus;
        const matchesSearch =
            !searchQuery ||
            issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.lockerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    // Toast helpers
    const showToast = (type: ToastMessage['type'], title: string, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Event handlers
    const handleIssueClick = (issue: LockerIssue) => {
        setSelectedIssue(issue);
    };

    const handleStatusChange = async (issueId: string, newStatus: LockerIssueStatus) => {
        try {
            await updateIssue(issueId, { status: newStatus });
            showToast('success', 'Status Updated', 'Issue status has been updated successfully');
        } catch (error: any) {
            showToast('error', 'Update Failed', error.message || 'Failed to update issue status');
            throw error; // Re-throw to trigger rollback in Kanban board
        }
    };

    const handleUpdateIssue = async (issueId: string, data: any) => {
        try {
            await updateIssue(issueId, data);
            showToast('success', 'Issue Updated', 'Issue has been updated successfully');
            await refetch();
        } catch (error: any) {
            showToast('error', 'Update Failed', error.message || 'Failed to update issue');
            throw error;
        }
    };

    const handleResolveIssue = async (issueId: string, data: any) => {
        try {
            await resolveIssue(issueId, data);
            showToast('success', 'Issue Resolved', 'Issue has been resolved and locker is now available');
            await refetch();
        } catch (error: any) {
            showToast('error', 'Resolution Failed', error.message || 'Failed to resolve issue');
            throw error;
        }
    };

    const handleRefresh = async () => {
        try {
            await refetch();
            showToast('success', 'Data Refreshed', 'Issue data has been reloaded from the server');
        } catch (error: any) {
            showToast('error', 'Refresh Failed', error.message || 'Failed to refresh data');
        }
    };

    const handleViewMaintenance = (lockerId: string) => {
        setSelectedLockerId(lockerId);
        setShowMaintenancePanel(true);
        refetchMaintenance();
    };

    // Calculate stats
    const stats = {
        total: filteredIssues.length,
        open: filteredIssues.filter((i) => i.status === 'OPEN').length,
        inProgress: filteredIssues.filter((i) => i.status === 'IN_PROGRESS').length,
        resolved: filteredIssues.filter((i) => i.status === 'RESOLVED').length,
        critical: filteredIssues.filter((i) => i.severity === 'CRITICAL').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-blue-600" />
                            Locker Support & Incident Response
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Kanban-style workspace for managing locker issues and maintenance
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Report Issue
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <StatCard
                        label="Total Issues"
                        value={stats.total}
                        icon={<BarChart3 className="w-5 h-5" />}
                        color="blue"
                    />
                    <StatCard
                        label="Open"
                        value={stats.open}
                        icon={<AlertCircle className="w-5 h-5" />}
                        color="red"
                    />
                    <StatCard
                        label="In Progress"
                        value={stats.inProgress}
                        icon={<Clock className="w-5 h-5" />}
                        color="yellow"
                    />
                    <StatCard
                        label="Resolved"
                        value={stats.resolved}
                        icon={<CheckCircle className="w-5 h-5" />}
                        color="green"
                    />
                    <StatCard
                        label="Critical"
                        value={stats.critical}
                        icon={<AlertCircle className="w-5 h-5 animate-pulse" />}
                        color="red"
                        highlight
                    />
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search issues by title, locker code, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-red-900">Error Loading Issues</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <IssueKanbanBoard
                    issues={filteredIssues}
                    onIssueClick={handleIssueClick}
                    onStatusChange={handleStatusChange}
                    loading={loading}
                />
            </div>

            {/* API Reference Panel */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Active API Endpoints
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <ApiEndpointCard
                        method="GET"
                        endpoint="/api/v1/admin/lockers?status=OUT_OF_SERVICE"
                        description="Load impacted lockers"
                    />
                    <ApiEndpointCard
                        method="GET"
                        endpoint="/api/v1/admin/lockers/{lockerId}/issues"
                        description="Fetch locker issues"
                    />
                    <ApiEndpointCard
                        method="PATCH"
                        endpoint="/api/v1/admin/lockers/issues/{issueId}"
                        description="Update issue status"
                    />
                    <ApiEndpointCard
                        method="POST"
                        endpoint="/api/v1/admin/lockers/issues/{issueId}/resolve"
                        description="Resolve issue"
                    />
                    <ApiEndpointCard
                        method="GET"
                        endpoint="/api/v1/admin/lockers/{lockerId}/maintenance/history"
                        description="Maintenance records"
                    />
                    <ApiEndpointCard
                        method="GET"
                        endpoint="/api/v1/admin/lockers/issues"
                        description="All open issues"
                    />
                </div>
            </div>

            {/* Modals & Panels */}
            {selectedIssue && (
                <IssueDetailPanel
                    issue={selectedIssue}
                    onClose={() => setSelectedIssue(null)}
                    onUpdate={handleUpdateIssue}
                    onResolve={handleResolveIssue}
                />
            )}

            {showCreateModal && (
                <CreateIssueModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        refetch();
                        showToast('success', 'Issue Created', 'New issue has been reported successfully');
                    }}
                />
            )}

            {showMaintenancePanel && selectedLockerId && (
                <MaintenanceHistoryPanel
                    lockerId={selectedLockerId}
                    records={maintenanceRecords}
                    onClose={() => {
                        setShowMaintenancePanel(false);
                        setSelectedLockerId(null);
                    }}
                />
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'red' | 'yellow' | 'green';
    highlight?: boolean;
}

function StatCard({ label, value, icon, color, highlight }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        green: 'bg-green-50 text-green-600 border-green-200',
    };

    return (
        <div
            className={cn(
                'rounded-lg p-4 border-2',
                colorClasses[color],
                highlight && 'ring-2 ring-red-400 ring-offset-2'
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                {icon}
            </div>
        </div>
    );
}

interface ApiEndpointCardProps {
    method: string;
    endpoint: string;
    description: string;
}

function ApiEndpointCard({ method, endpoint, description }: ApiEndpointCardProps) {
    const methodColors = {
        GET: 'bg-green-100 text-green-800',
        POST: 'bg-blue-100 text-blue-800',
        PATCH: 'bg-yellow-100 text-yellow-800',
        PUT: 'bg-orange-100 text-orange-800',
        DELETE: 'bg-red-100 text-red-800',
    };

    return (
        <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
                <span
                    className={cn(
                        'text-xs font-mono font-bold px-2 py-1 rounded',
                        methodColors[method as keyof typeof methodColors]
                    )}
                >
                    {method}
                </span>
            </div>
            <p className="font-mono text-xs text-gray-700 mb-2 break-all">{endpoint}</p>
            <p className="text-xs text-gray-600">{description}</p>
        </div>
    );
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    const toastColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600',
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'rounded-lg shadow-lg p-4 text-white flex items-start gap-3 animate-slide-in-right',
                        toastColors[toast.type]
                    )}
                >
                    <div className="flex-1">
                        <p className="font-semibold">{toast.title}</p>
                        <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => onRemove(toast.id)}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default LockerSupportWorkspace;