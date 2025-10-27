// src/presentation/components/locker-operations/UpdateMaintenanceModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { LockerMaintenanceRecord } from '../../../core/entities/lockers';
import { UpdateMaintenancePayload } from '../../../core/entities/locker-operations';

interface UpdateMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    maintenance: LockerMaintenanceRecord | null;
    onSubmit: (payload: UpdateMaintenancePayload) => Promise<void>;
}

const statuses: UpdateMaintenancePayload['status'][] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export function UpdateMaintenanceModal({ isOpen, onClose, maintenance, onSubmit }: UpdateMaintenanceModalProps) {
    const [form, setForm] = useState<UpdateMaintenancePayload>(() => ({
        status: maintenance?.status ?? 'SCHEDULED',
        completedAt: maintenance?.completedAt ?? '',
        actualDurationHours: maintenance?.actualDurationHours ?? undefined,
        findings: maintenance?.findings ?? '',
        partsUsed: maintenance?.partsUsed ?? [],
        laborHours: maintenance?.laborHours ?? undefined,
        totalCost: maintenance?.totalCost ?? undefined,
    }));
    const [partsInput, setPartsInput] = useState((maintenance?.partsUsed ?? []).join(', '));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (maintenance) {
            setForm({
                status: maintenance.status,
                completedAt: maintenance.completedAt ?? '',
                actualDurationHours: maintenance.actualDurationHours ?? undefined,
                findings: maintenance.findings ?? '',
                partsUsed: maintenance.partsUsed ?? [],
                laborHours: maintenance.laborHours ?? undefined,
                totalCost: maintenance.totalCost ?? undefined,
            });
            setPartsInput((maintenance.partsUsed ?? []).join(', '));
        }
    }, [maintenance]);

    const resetForm = () => {
        setForm({
            status: maintenance?.status ?? 'SCHEDULED',
            completedAt: maintenance?.completedAt ?? '',
            actualDurationHours: maintenance?.actualDurationHours ?? undefined,
            findings: maintenance?.findings ?? '',
            partsUsed: maintenance?.partsUsed ?? [],
            laborHours: maintenance?.laborHours ?? undefined,
            totalCost: maintenance?.totalCost ?? undefined,
        });
        setPartsInput((maintenance?.partsUsed ?? []).join(', '));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!maintenance) return;
        setSubmitting(true);
        try {
            await onSubmit({
                ...form,
                partsUsed: partsInput
                    .split(',')
                    .map((part) => part.trim())
                    .filter(Boolean),
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title="Update Maintenance" size="lg">
            {maintenance ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                        <p className="font-semibold">Maintenance #{maintenance.id}</p>
                        <p className="text-xs text-emerald-700">Scheduled: {new Date(maintenance.scheduledDate).toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Status
                            <select
                                value={form.status ?? maintenance.status}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        status: e.target.value as UpdateMaintenancePayload['status'],
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Completed At
                            <input
                                type="datetime-local"
                                value={form.completedAt ?? ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, completedAt: e.target.value }))}
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Actual Duration (hours)
                            <input
                                type="number"
                                min={0}
                                step="0.5"
                                value={form.actualDurationHours ?? ''}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        actualDurationHours: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Labor Hours
                            <input
                                type="number"
                                min={0}
                                step="0.5"
                                value={form.laborHours ?? ''}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        laborHours: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Total Cost
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.totalCost ?? ''}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        totalCost: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Findings
                        <textarea
                            rows={3}
                            value={form.findings ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, findings: e.target.value }))}
                            placeholder="Document findings and next steps"
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Parts Used (comma separated)
                        <input
                            value={partsInput}
                            onChange={(e) => setPartsInput(e.target.value)}
                            placeholder="Lock cylinder, Lubricant"
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
                            {submitting ? 'Saving...' : 'Update Maintenance'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-sm text-gray-600">Select a maintenance record to update.</div>
            )}
        </Modal>
    );
}
