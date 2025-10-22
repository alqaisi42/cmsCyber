// src/presentation/components/lockers/IssueDetailPanel.tsx
'use client';

import React, { useState } from 'react';
import {
    X,
    Calendar,
    User,
    Clock,
    AlertTriangle,
    CheckCircle,
    FileText,
    Save,
    Wrench,
} from 'lucide-react';
import { LockerIssue, ResolveLockerIssuePayload } from '../../../core/entities/lockers';
import { cn } from '../../../shared/utils/cn';

// ==========================================
// TYPES
// ==========================================

interface IssueDetailPanelProps {
    issue: LockerIssue | null;
    onClose: () => void;
    onUpdate: (issueId: string, data: any) => Promise<void>;
    onResolve: (issueId: string, data: ResolveLockerIssuePayload) => Promise<void>;
}

const SEVERITY_COLORS = {
    LOW: 'bg-green-100 text-green-800 border-green-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_COLORS = {
    OPEN: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
};

// ==========================================
// COMPONENT
// ==========================================

export function IssueDetailPanel({ issue, onClose, onUpdate, onResolve }: IssueDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'resolve'>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for updates
    const [assignedTo, setAssignedTo] = useState(issue?.assignedTo || '');
    const [estimatedResolutionTime, setEstimatedResolutionTime] = useState(
        issue?.estimatedResolutionTime || ''
    );
    const [notes, setNotes] = useState('');

    // Form state for resolution
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [partsReplaced, setPartsReplaced] = useState('');
    const [laborHours, setLaborHours] = useState('');
    const [totalCost, setTotalCost] = useState('');
    const [makeLockerAvailable, setMakeLockerAvailable] = useState(true);

    if (!issue) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onUpdate(issue.id, {
                assignedTo: assignedTo || null,
                estimatedResolutionTime: estimatedResolutionTime || null,
                notes: notes || null,
            });
            setNotes('');
        } catch (error) {
            console.error('Failed to update issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const resolveData: ResolveLockerIssuePayload = {
                resolutionNotes,
                partsReplaced: partsReplaced ? partsReplaced.split(',').map((p) => p.trim()) : undefined,
                laborHours: laborHours ? parseFloat(laborHours) : undefined,
                totalCost: totalCost ? parseFloat(totalCost) : undefined,
                makeLockerAvailable,
            };

            await onResolve(issue.id, resolveData);
            onClose();
        } catch (error) {
            console.error('Failed to resolve issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span
                                    className={cn(
                                        'text-xs font-medium px-2 py-1 rounded-md border',
                                        SEVERITY_COLORS[issue.severity]
                                    )}
                                >
                                    {issue.severity}
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-medium px-2 py-1 rounded-md',
                                        STATUS_COLORS[issue.status]
                                    )}
                                >
                                    {issue.status}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{issue.title}</h2>
                            <p className="text-sm text-gray-500">Issue ID: {issue.id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={cn(
                                'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'details'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Details & Update
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('resolve')}
                            className={cn(
                                'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'resolve'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Resolve Issue
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'details' ? (
                        <DetailsTab
                            issue={issue}
                            assignedTo={assignedTo}
                            setAssignedTo={setAssignedTo}
                            estimatedResolutionTime={estimatedResolutionTime}
                            setEstimatedResolutionTime={setEstimatedResolutionTime}
                            notes={notes}
                            setNotes={setNotes}
                            onSubmit={handleUpdate}
                            isSubmitting={isSubmitting}
                        />
                    ) : (
                        <ResolveTab
                            resolutionNotes={resolutionNotes}
                            setResolutionNotes={setResolutionNotes}
                            partsReplaced={partsReplaced}
                            setPartsReplaced={setPartsReplaced}
                            laborHours={laborHours}
                            setLaborHours={setLaborHours}
                            totalCost={totalCost}
                            setTotalCost={setTotalCost}
                            makeLockerAvailable={makeLockerAvailable}
                            setMakeLockerAvailable={setMakeLockerAvailable}
                            onSubmit={handleResolve}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// DETAILS TAB
// ==========================================

interface DetailsTabProps {
    issue: LockerIssue;
    assignedTo: string;
    setAssignedTo: (value: string) => void;
    estimatedResolutionTime: string;
    setEstimatedResolutionTime: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

function DetailsTab({
                        issue,
                        assignedTo,
                        setAssignedTo,
                        estimatedResolutionTime,
                        setEstimatedResolutionTime,
                        notes,
                        setNotes,
                        onSubmit,
                        isSubmitting,
                    }: DetailsTabProps) {
    return (
        <div className="space-y-6">
            {/* Issue Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Reported by:</span>
                    <span className="font-medium text-gray-900">{issue.reportedBy}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Reported at:</span>
                    <span className="font-medium text-gray-900">
                        {new Date(issue.reportedAt).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Locker Code:</span>
                    <span className="font-mono font-medium text-gray-900">{issue.lockerCode}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Issue Type:</span>
                    <span className="font-medium text-gray-900">{issue.issueType}</span>
                </div>
            </div>

            {/* Description */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700">
                    {issue.description}
                </div>
            </div>

            {/* Update Form */}
            <form onSubmit={onSubmit} className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Update Issue</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned To
                    </label>
                    <input
                        type="text"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="Enter technician name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Resolution Time
                    </label>
                    <input
                        type="datetime-local"
                        value={estimatedResolutionTime}
                        onChange={(e) => setEstimatedResolutionTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Add notes about this update..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                        'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                        isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Updates
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

// ==========================================
// RESOLVE TAB
// ==========================================

interface ResolveTabProps {
    resolutionNotes: string;
    setResolutionNotes: (value: string) => void;
    partsReplaced: string;
    setPartsReplaced: (value: string) => void;
    laborHours: string;
    setLaborHours: (value: string) => void;
    totalCost: string;
    setTotalCost: (value: string) => void;
    makeLockerAvailable: boolean;
    setMakeLockerAvailable: (value: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

function ResolveTab({
                        resolutionNotes,
                        setResolutionNotes,
                        partsReplaced,
                        setPartsReplaced,
                        laborHours,
                        setLaborHours,
                        totalCost,
                        setTotalCost,
                        makeLockerAvailable,
                        setMakeLockerAvailable,
                        onSubmit,
                        isSubmitting,
                    }: ResolveTabProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-900 mb-1">Resolve This Issue</h4>
                        <p className="text-sm text-blue-700">
                            Complete the form below to mark this issue as resolved and optionally make the
                            locker available again.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parts Replaced (comma-separated)
                </label>
                <input
                    type="text"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    placeholder="e.g., Lock mechanism, Door sensor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Labor Hours
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        value={laborHours}
                        onChange={(e) => setLaborHours(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Cost ($)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                    type="checkbox"
                    id="makeAvailable"
                    checked={makeLockerAvailable}
                    onChange={(e) => setMakeLockerAvailable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="makeAvailable" className="text-sm text-gray-700 cursor-pointer">
                    Make locker available after resolution
                </label>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || !resolutionNotes}
                className={cn(
                    'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                    isSubmitting || !resolutionNotes
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                )}
            >
                {isSubmitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resolving...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Resolve & Close Issue
                    </>
                )}
            </button>
        </form>
    );
}

export default IssueDetailPanel;