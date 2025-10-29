// src/presentation/components/locker-operations/UpdateLockerStatusModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { UpdateLockerStatusPayload } from '../../../core/entities/locker-operations';
import { LockerSummary } from '../../../core/entities/lockers';

interface UpdateLockerStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    locker: LockerSummary | null;
    onSubmit: (payload: UpdateLockerStatusPayload) => Promise<void>;
}

const statuses: UpdateLockerStatusPayload['status'][] = [
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'MAINTENANCE',
    'OUT_OF_SERVICE',
    'INACTIVE',
];

export function UpdateLockerStatusModal({ isOpen, onClose, locker, onSubmit }: UpdateLockerStatusModalProps) {
    const [form, setForm] = useState<UpdateLockerStatusPayload>(() => ({
        status: locker?.status ?? 'AVAILABLE',
        reason: '',
        estimatedDowntimeHours: undefined,
    }));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (locker) {
            setForm({
                status: locker.status,
                reason: '',
                estimatedDowntimeHours: undefined,
            });
        }
    }, [locker]);

    const resetForm = () => {
        setForm({
            status: locker?.status ?? 'AVAILABLE',
            reason: '',
            estimatedDowntimeHours: undefined,
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!locker) return;
        setSubmitting(true);
        try {
            await onSubmit(form);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title="Update Locker Status" size="sm">
            {locker ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                        <p className="font-semibold">{locker.name || locker.code}</p>
                        <p className="text-xs text-gray-500">{locker.code}</p>
                        <p className="mt-2 text-xs">Current status: {locker.status}</p>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Status
                        <select
                            value={form.status}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    status: e.target.value as UpdateLockerStatusPayload['status'],
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
                        Reason
                        <textarea
                            value={form.reason ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                            rows={3}
                            placeholder="Provide context or maintenance notes"
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Estimated Downtime (hours)
                        <input
                            type="number"
                            min={0}
                            value={form.estimatedDowntimeHours ?? ''}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    estimatedDowntimeHours: e.target.value ? Number(e.target.value) : undefined,
                                }))
                            }
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
                            {submitting ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-sm text-gray-600">Select a locker to update its status.</div>
            )}
        </Modal>
    );
}
