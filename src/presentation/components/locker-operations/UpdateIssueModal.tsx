// src/presentation/components/locker-operations/UpdateIssueModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { LockerIssue } from '../../../core/entities/lockers';
import { UpdateIssuePayload } from '../../../core/entities/locker-operations';

interface UpdateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    issue: LockerIssue | null;
    onSubmit: (payload: UpdateIssuePayload) => Promise<void>;
}

const statuses: UpdateIssuePayload['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function UpdateIssueModal({ isOpen, onClose, issue, onSubmit }: UpdateIssueModalProps) {
    const [form, setForm] = useState<UpdateIssuePayload>(() => ({
        status: issue?.status ?? 'OPEN',
        assignedTo: issue?.assignedTo ?? '',
        updateNotes: '',
    }));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (issue) {
            setForm({
                status: issue.status,
                assignedTo: issue.assignedTo ?? '',
                updateNotes: '',
            });
        }
    }, [issue]);

    const resetForm = () => {
        setForm({
            status: issue?.status ?? 'OPEN',
            assignedTo: issue?.assignedTo ?? '',
            updateNotes: '',
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!issue) return;
        setSubmitting(true);
        try {
            await onSubmit(form);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title="Update Issue" size="sm">
            {issue ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-900">
                        <p className="font-semibold">{issue.title}</p>
                        <p className="text-xs text-rose-700">Severity: {issue.severity}</p>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Status
                        <select
                            value={form.status ?? issue.status}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    status: e.target.value as UpdateIssuePayload['status'],
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
                        Assigned To
                        <input
                            value={form.assignedTo ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                            placeholder="tech02"
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Update Notes
                        <textarea
                            rows={3}
                            value={form.updateNotes ?? ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, updateNotes: e.target.value }))}
                            placeholder="Share progress or next steps"
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
                            {submitting ? 'Saving...' : 'Update Issue'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-sm text-gray-600">Select an issue to update.</div>
            )}
        </Modal>
    );
}
