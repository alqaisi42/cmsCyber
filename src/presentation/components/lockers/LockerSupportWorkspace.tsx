// src/presentation/components/lockers/LockerSupportWorkspace.tsx
'use client';

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
    AlertCircle,
    Wrench,
    Package,
    MapPin,
    Search,
    Plus,
    RefreshCw,
} from 'lucide-react';
import {
    LockerSummary,
    LockerIssue,
    LockerIssueStatus,
    LockerDetails,
} from '../../../core/entities/lockers';
import {lockerAdminRepository} from '../../../infrastructure/repositories/locker-admin.repository';
import {cn} from '../../../shared/utils/cn';
import IssueKanbanBoard, {IssueSeverity} from './IssueKanbanBoard';
import MaintenanceHistoryPanel from './MaintenanceHistoryPanel';
import {useToast} from "@/presentation/components/ui/toast";
import {useAllOpenIssues, useMaintenanceHistory} from "@/presentation/hooks/useLockerSupport";
import IssueDetailPanel from './IssueDetailPanel';
import CreateIssueModal from './CreateIssueModal';
import LockerDetailOverview from './LockerDetailOverview';

// ==========================================
// TYPES
// ==========================================

interface LockerSupportWorkspaceProps {
    token?: string;
}

interface FilterState {
    severity: IssueSeverity | 'ALL';
    location: string;
    search: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function LockerSupportWorkspace({token}: LockerSupportWorkspaceProps) {
    const {pushToast} = useToast();

    const {issues: allOpenIssues, loading: loadingIssues, refresh: refreshIssues} = useAllOpenIssues();
    const issuesArray = Array.isArray(allOpenIssues) ? allOpenIssues : allOpenIssues ?? [];

    const {history: maintenanceHistory, loadMaintenanceHistory} = useMaintenanceHistory();

    // State
    const [lockers, setLockers] = useState<LockerSummary[]>([]);
    const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);
    const [filteredIssues, setFilteredIssues] = useState<LockerIssue[]>([]);
    const [selectedLockerDetails, setSelectedLockerDetails] = useState<LockerDetails | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        severity: 'ALL',
        location: '',
        search: '',
    });
    const [showMaintenancePanel, setShowMaintenancePanel] = useState(false);
    const [loadingLockers, setLoadingLockers] = useState(false);
    const [loadingLockerDetails, setLoadingLockerDetails] = useState(false);
    const [updatingIssue, setUpdatingIssue] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<LockerIssue | null>(null);
    const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);

    // Load lockers with issues
    const loadLockersWithIssues = useCallback(async () => {
        setLoadingLockers(true);
        try {
            const response = await lockerAdminRepository.getAllLockers({
                maintenanceStatus: 'REQUIRES_MAINTENANCE',
                page: 0,
                pageSize: 100,
            });
            setLockers(response.data);

            // Auto-select first locker if available
            if (response.data.length > 0 && !selectedLockerId) {
                setSelectedLockerId(response.data[0].id);
            }
        } catch (error) {
            console.error('Failed to load lockers:', error);
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to load lockers',
            });
        } finally {
            setLoadingLockers(false);
        }
    }, [selectedLockerId, pushToast]);

    const loadLockerDetails = useCallback(async (lockerId: string) => {
        setLoadingLockerDetails(true);
        try {
            const details = await lockerAdminRepository.getLockerById(lockerId);
            setSelectedLockerDetails(details);
        } catch (error) {
            console.error('Failed to load locker details:', error);
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Unable to load locker details',
            });
        } finally {
            setLoadingLockerDetails(false);
        }
    }, [pushToast]);

    // Filter issues based on selected locker and filters
    useEffect(() => {
        let filtered = [...allOpenIssues];

        // Filter by selected locker
        if (selectedLockerId) {
            filtered = filtered.filter(issue => issue.lockerId === selectedLockerId);
        }

        // Filter by severity
        if (filters.severity !== 'ALL') {
            filtered = filtered.filter(issue => issue.severity === filters.severity);
        }

        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title.toLowerCase().includes(searchLower) ||
                issue.description.toLowerCase().includes(searchLower) ||
                issue.lockerCode.toLowerCase().includes(searchLower)
            );
        }

        setFilteredIssues(filtered);
    }, [allOpenIssues, selectedLockerId, filters]);

    // Handle issue status change
    const handleIssueStatusChange = async (issueId: string, newStatus: LockerIssueStatus) => {
        setUpdatingIssue(true);
        try {
            await lockerAdminRepository.updateIssue(issueId, {status: newStatus});

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Issue status updated successfully',
            });

            // Refresh issues
            await refreshIssues();
        } catch (error) {
            console.error('Failed to update issue:', error);
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to update issue status',
            });
        } finally {
            setUpdatingIssue(false);
        }
    };

    // Handle issue click
    const handleIssueClick = (issue: LockerIssue) => {
        setSelectedIssue(issue);
    };

    const handleIssueDetailUpdate = async (issueId: string, data: any) => {
        setUpdatingIssue(true);
        try {
            await lockerAdminRepository.updateIssue(issueId, data);

            pushToast({
                type: 'success',
                title: 'Issue Updated',
                description: 'Issue details were updated successfully.',
            });

            const refreshed = await refreshIssues();
            if (refreshed) {
                const latest = refreshed.find(issue => issue.id === issueId);
                if (latest) {
                    setSelectedIssue(latest);
                }
            }

            if (selectedLockerId) {
                await loadLockerDetails(selectedLockerId);
            }
        } catch (error) {
            console.error('Failed to update issue:', error);
            pushToast({
                type: 'error',
                title: 'Update Failed',
                description: 'Unable to update the selected issue.',
            });
        } finally {
            setUpdatingIssue(false);
        }
    };

    const handleIssueDetailResolve = async (issueId: string, data: any) => {
        setUpdatingIssue(true);
        try {
            await lockerAdminRepository.resolveIssue(issueId, data);

            pushToast({
                type: 'success',
                title: 'Issue Resolved',
                description: 'The locker issue has been resolved.',
            });

            const refreshed = await refreshIssues();
            if (refreshed) {
                const latest = refreshed.find(issue => issue.id === issueId);
                setSelectedIssue(latest ?? null);
            } else {
                setSelectedIssue(null);
            }

            await loadLockersWithIssues();
            if (selectedLockerId) {
                await loadLockerDetails(selectedLockerId);
            }
        } catch (error) {
            console.error('Failed to resolve issue:', error);
            pushToast({
                type: 'error',
                title: 'Resolution Failed',
                description: 'Unable to resolve the selected issue.',
            });
        } finally {
            setUpdatingIssue(false);
        }
    };

    // Load maintenance history and locker details when locker is selected
    useEffect(() => {
        if (selectedLockerId) {
            loadMaintenanceHistory(selectedLockerId);
            loadLockerDetails(selectedLockerId);
        } else {
            setSelectedLockerDetails(null);
        }
    }, [selectedLockerId, loadMaintenanceHistory, loadLockerDetails]);

    // Initial load
    useEffect(() => {
        loadLockersWithIssues();
    }, []);

    useEffect(() => {
        if (!selectedIssue) return;
        const latest = allOpenIssues.find(issue => issue.id === selectedIssue.id);
        if (latest && latest !== selectedIssue) {
            setSelectedIssue(latest);
        }
    }, [allOpenIssues, selectedIssue]);

    useEffect(() => {
        if (!selectedLockerDetails) return;
        setSelectedLockerDetails(prev => prev ? ({
            ...prev,
            maintenanceHistory: maintenanceHistory,
        }) : prev);
    }, [maintenanceHistory]);

    const selectedLockerIssueCount = useMemo(() => {
        if (!selectedLockerId) {
            return filteredIssues.length;
        }
        return allOpenIssues.filter(issue => issue.lockerId === selectedLockerId).length;
    }, [allOpenIssues, filteredIssues.length, selectedLockerId]);

    const handleIssueCreationSuccess = useCallback(async () => {
        setShowCreateIssueModal(false);
        await refreshIssues();
        await loadLockersWithIssues();
        if (selectedLockerId) {
            await loadLockerDetails(selectedLockerId);
        }
    }, [refreshIssues, loadLockersWithIssues, selectedLockerId, loadLockerDetails]);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">Locker Support Center</h1>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {filteredIssues.length} Active Issues
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refreshIssues()}
                            disabled={loadingIssues}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={cn('w-4 h-4', loadingIssues && 'animate-spin')}/>
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateIssueModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            <Plus className="w-4 h-4"/>
                            Report Issue
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Severity Filter */}
                    <select
                        value={filters.severity}
                        onChange={(e) => setFilters(prev => ({...prev, severity: e.target.value as any}))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    {/* Locker Filter */}
                    <select
                        value={selectedLockerId || ''}
                        onChange={(e) => setSelectedLockerId(e.target.value || null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Lockers</option>
                        {lockers.map(locker => (
                            <option key={locker.id} value={locker.id}>
                                {locker.code} - {locker.locationName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Locker List */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                            Lockers with Issues
                        </h2>
                        {loadingLockers ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : lockers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
                                <p className="text-sm">No lockers with issues</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lockers.map(locker => {
                                    const lockerIssues = allOpenIssues.filter(i => i.lockerId === locker.id);
                                    const criticalCount = lockerIssues.filter(i => i.severity === 'CRITICAL').length;

                                    return (
                                        <button
                                            key={locker.id}
                                            onClick={() => setSelectedLockerId(locker.id)}
                                            className={cn(
                                                'w-full text-left p-3 rounded-lg border-2 transition-all',
                                                selectedLockerId === locker.id
                                                    ? 'bg-blue-50 border-blue-500'
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{locker.code}</h3>
                                                    <p className="text-sm text-gray-600">{locker.locationName}</p>
                                                </div>
                                                {criticalCount > 0 && (
                                                    <span
                                                        className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                        {criticalCount} Critical
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3"/>
                                                    {locker.locationName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3"/>
                                                    {lockerIssues.length} issues
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="p-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                            Quick Stats
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Critical Issues</span>
                                <span className="text-sm font-semibold text-red-600">
                                    {allOpenIssues.filter(i => i.severity === 'CRITICAL').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">In Progress</span>
                                <span className="text-sm font-semibold text-blue-600">
                                    {allOpenIssues.filter(i => i.status === 'IN_PROGRESS').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-sm font-semibold text-yellow-600">
                                    {allOpenIssues.filter(i => i.status === 'OPEN').length}
                                </span>
                            </div>
                        </div>

                        {selectedLockerId && (
                            <button
                                onClick={() => setShowMaintenancePanel(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                            >
                                <Wrench className="w-4 h-4"/>
                                View Maintenance History
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content - Details + Kanban */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <LockerDetailOverview
                            locker={selectedLockerDetails}
                            loading={loadingLockerDetails && !!selectedLockerId}
                            issueCount={selectedLockerIssueCount}
                            onViewMaintenance={() => setShowMaintenancePanel(true)}
                        />

                        <div className="bg-transparent">
                            {loadingIssues ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-500">Loading issues...</p>
                                    </div>
                                </div>
                            ) : filteredIssues.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                                        <p className="text-gray-500">
                                            {selectedLockerId
                                                ? 'This locker has no active issues'
                                                : 'Select a locker to view its issues'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <IssueKanbanBoard
                                    issues={filteredIssues}
                                    onIssueClick={handleIssueClick}
                                    onStatusChange={handleIssueStatusChange}
                                    loading={updatingIssue}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance History Panel */}
            {showMaintenancePanel && selectedLockerId && (
                <MaintenanceHistoryPanel
                    lockerId={selectedLockerId}
                    records={maintenanceHistory}
                    onClose={() => setShowMaintenancePanel(false)}
                />
            )}

            {selectedIssue && (
                <IssueDetailPanel
                    issue={selectedIssue}
                    onClose={() => setSelectedIssue(null)}
                    onUpdate={handleIssueDetailUpdate}
                    onResolve={handleIssueDetailResolve}
                />
            )}

            {showCreateIssueModal && (
                <CreateIssueModal
                    onClose={() => setShowCreateIssueModal(false)}
                    onSuccess={handleIssueCreationSuccess}
                    defaultLockerId={selectedLockerId ?? undefined}
                    lockerCode={selectedLockerDetails?.code}
                />
            )}
        </div>
    );
}

export default LockerSupportWorkspace;