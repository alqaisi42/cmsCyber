// src/presentation/components/locker-operations/ReportIssueModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { CreateIssuePayload } from '../../../core/entities/locker-operations';
import { LockerSummary } from '../../../core/entities/lockers';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    locker: LockerSummary | null;
    onSubmit: (payload: CreateIssuePayload) => Promise<void>;
    currentUser?: string;
}

const issueTypes = ['MECHANICAL','HARDWARE_MALFUNCTION', 'PHYSICAL_DAMAGE', 'SOFTWARE_ERROR', 'CLEANING_REQUIRED', 'OTHER'];
const severities: CreateIssuePayload['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function ReportIssueModal({ isOpen, onClose, locker, onSubmit, currentUser }: ReportIssueModalProps) {
    const [form, setForm] = useState<CreateIssuePayload>(() => ({
        lockerId: locker?.id ?? '',
        issueType: issueTypes[0],
        severity: 'MEDIUM',
        title: '',
        description: '',
        reportedBy: currentUser ?? 'system',
        attachments: [],
    }));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (locker) {
            setForm((prev) => ({
                ...prev,
                lockerId: locker.id,
            }));
        }
    }, [locker]);

    useEffect(() => {
        if (currentUser) {
            setForm((prev) => ({
                ...prev,
                reportedBy: currentUser,
            }));
        }
    }, [currentUser]);

    const resetForm = () => {
        setForm({
            lockerId: locker?.id ?? '',
            issueType: issueTypes[0],
            severity: 'MEDIUM',
            title: '',
            description: '',
            reportedBy: currentUser ?? 'system',
            attachments: [],
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.lockerId) return;
        setSubmitting(true);
        try {
            await onSubmit(form);
            resetForm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title="Report Locker Issue" size="lg">
            {locker ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-semibold">Reporting issue for {locker.name || locker.code}</p>
                        <p className="text-xs text-amber-700">Locker code: {locker.code}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Issue Type
                            <select
                                value={form.issueType}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        issueType: e.target.value,
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                {issueTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Severity
                            <select
                                value={form.severity}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        severity: e.target.value as CreateIssuePayload['severity'],
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                {severities.map((severity) => (
                                    <option key={severity} value={severity}>
                                        {severity}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Title
                        <input
                            required
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Door not closing properly"
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Description
                        <textarea
                            required
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the issue, steps to reproduce, etc."
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Reported By
                        <input
                            required
                            value={form.reportedBy}
                            onChange={(e) => setForm((prev) => ({ ...prev, reportedBy: e.target.value }))}
                            placeholder="engineer01"
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
                            {submitting ? 'Submitting...' : 'Submit Issue'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-sm text-gray-600">Select a locker to report an issue.</div>
            )}
        </Modal>
    );
}
