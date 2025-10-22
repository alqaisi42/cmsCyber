// src/presentation/components/lockers/MaintenanceHistoryPanel.tsx
'use client';

import React from 'react';
import { X, Wrench, Calendar, Clock, DollarSign, CheckCircle, AlertCircle, Tool } from 'lucide-react';
import { LockerMaintenanceRecord } from '../../../core/entities/lockers';
import { cn } from '../../../shared/utils/cn';

// ==========================================
// TYPES
// ==========================================

interface MaintenanceHistoryPanelProps {
    lockerId: string;
    records: LockerMaintenanceRecord[];
    onClose: () => void;
}

const STATUS_COLORS = {
    SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
};

const TYPE_COLORS = {
    PREVENTIVE: 'bg-blue-50 border-blue-200',
    CORRECTIVE: 'bg-orange-50 border-orange-200',
    EMERGENCY: 'bg-red-50 border-red-200',
};

// ==========================================
// COMPONENT
// ==========================================

export function MaintenanceHistoryPanel({ lockerId, records, onClose }: MaintenanceHistoryPanelProps) {
    const sortedRecords = [...records].sort(
        (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Wrench className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Maintenance History</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Locker ID: <span className="font-mono">{lockerId}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {sortedRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Wrench className="w-16 h-16 mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No Maintenance Records</h3>
                            <p className="text-sm text-gray-500">
                                This locker has no maintenance history yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedRecords.map((record) => (
                                <MaintenanceRecordCard key={record.id} record={record} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// MAINTENANCE RECORD CARD
// ==========================================

interface MaintenanceRecordCardProps {
    record: LockerMaintenanceRecord;
}

function MaintenanceRecordCard({ record }: MaintenanceRecordCardProps) {
    return (
        <div
            className={cn(
                'border-2 rounded-xl p-5 transition-all hover:shadow-md',
                TYPE_COLORS[record.maintenanceType]
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Tool className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{record.maintenanceType}</h3>
                        <p className="text-sm text-gray-500">ID: {record.id.slice(0, 8)}...</p>
                    </div>
                </div>
                <span
                    className={cn(
                        'text-xs font-medium px-3 py-1 rounded-full border-2',
                        STATUS_COLORS[record.status]
                    )}
                >
                    {record.status}
                </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-500">Scheduled</p>
                        <p className="font-medium text-gray-900">
                            {new Date(record.scheduledDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {record.completedAt && (
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                            <p className="text-gray-500">Completed</p>
                            <p className="font-medium text-gray-900">
                                {new Date(record.completedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">
                            {record.actualDurationHours || record.estimatedDurationHours} hours
                        </p>
                    </div>
                </div>

                {record.totalCost && (
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Total Cost</p>
                            <p className="font-medium text-gray-900">${record.totalCost.toFixed(2)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Assigned To */}
            <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                <p className="font-medium text-gray-900">{record.assignedTo}</p>
            </div>

            {/* Tasks */}
            {record.tasks && record.tasks.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tasks</p>
                    <ul className="space-y-1">
                        {record.tasks.map((task, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                {record.completedTasks?.includes(task) ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                )}
                                <span
                                    className={
                                        record.completedTasks?.includes(task)
                                            ? 'text-gray-900'
                                            : 'text-gray-500'
                                    }
                                >
                                    {task}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Parts Used */}
            {record.partsUsed && record.partsUsed.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Parts Used</p>
                    <div className="flex flex-wrap gap-2">
                        {record.partsUsed.map((part, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700"
                            >
                                {part}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Findings */}
            {record.findings && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Findings</p>
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700">
                        {record.findings}
                    </div>
                </div>
            )}

            {/* Notes */}
            {record.notes && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700">
                        {record.notes}
                    </div>
                </div>
            )}

            {/* Next Maintenance Due */}
            {record.nextMaintenanceDue && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Next Maintenance Due:</span>
                        <span className="font-medium text-blue-600">
                            {new Date(record.nextMaintenanceDue).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MaintenanceHistoryPanel;