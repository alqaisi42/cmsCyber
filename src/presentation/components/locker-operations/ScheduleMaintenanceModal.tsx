// src/presentation/components/locker-operations/ScheduleMaintenanceModal.tsx

'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ScheduleMaintenancePayload } from '../../../core/entities/locker-operations';
import { LockerSummary } from '../../../core/entities/lockers';

interface ScheduleMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    locker: LockerSummary | null;
    onSubmit: (payload: ScheduleMaintenancePayload) => Promise<void>;
}

const maintenanceTypes: ScheduleMaintenancePayload['maintenanceType'][] = ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY'];

export function ScheduleMaintenanceModal({ isOpen, onClose, locker, onSubmit }: ScheduleMaintenanceModalProps) {
    const [form, setForm] = useState<ScheduleMaintenancePayload>(() => ({
        maintenanceType: 'PREVENTIVE',
        scheduledDate: new Date().toISOString().slice(0, 16),
        estimatedDurationHours: 2,
        assignedTo: '',
        tasks: [],
        notes: '',
    }));
    const [tasksInput, setTasksInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setForm({
            maintenanceType: 'PREVENTIVE',
            scheduledDate: new Date().toISOString().slice(0, 16),
            estimatedDurationHours: 2,
            assignedTo: '',
            tasks: [],
            notes: '',
        });
        setTasksInput('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!locker) return;
        setSubmitting(true);
        try {
            await onSubmit({
                ...form,
                tasks: tasksInput
                    .split(',')
                    .map((task) => task.trim())
                    .filter(Boolean),
            });
            resetForm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title="Schedule Maintenance" size="lg">
            {locker ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-900">
                        <p className="font-semibold">Scheduling maintenance for {locker.name || locker.code}</p>
                        <p className="text-xs text-slate-600">Locker code: {locker.code}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Maintenance Type
                            <select
                                value={form.maintenanceType}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        maintenanceType: e.target.value as ScheduleMaintenancePayload['maintenanceType'],
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                {maintenanceTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Scheduled Date
                            <input
                                type="datetime-local"
                                value={form.scheduledDate}
                                onChange={(e) => setForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Estimated Duration (hours)
                            <input
                                type="number"
                                min={1}
                                value={form.estimatedDurationHours}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        estimatedDurationHours: Number(e.target.value),
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 md:col-span-2">
                            Assigned To
                            <input
                                required
                                value={form.assignedTo}
                                onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                                placeholder="tech05"
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Tasks (comma separated)
                        <input
                            value={tasksInput}
                            onChange={(e) => setTasksInput(e.target.value)}
                            placeholder="Check hinges, Lubricate locks"
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Notes
                        <textarea
                            rows={4}
                            value={form.notes ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add context or instructions for the technician"
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Scheduling...' : 'Schedule Maintenance'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-sm text-gray-600">Select a locker to schedule maintenance.</div>
            )}
        </Modal>
    );
}
