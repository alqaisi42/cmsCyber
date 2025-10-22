// src/presentation/components/lockers/CreateIssueModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Send } from 'lucide-react';
import { lockerAdminRepository, ReportLockerIssueRequest } from '@/infrastructure/repositories/locker-admin.repository';
import { cn } from '@/shared/utils/cn';

// ==========================================
// TYPES
// ==========================================

interface CreateIssueModalProps {
    onClose: () => void;
    onSuccess: () => void;
    defaultLockerId?: string;
    lockerCode?: string;
}

const ISSUE_TYPES = [
    'Hardware Malfunction',
    'Lock Failure',
    'Door Stuck',
    'Sensor Error',
    'Power Issue',
    'Connectivity Problem',
    'Physical Damage',
    'Cleaning Required',
    'Other',
];

const SEVERITY_OPTIONS = [
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-300' },
];

// ==========================================
// COMPONENT
// ==========================================

export function CreateIssueModal({ onClose, onSuccess, defaultLockerId, lockerCode }: CreateIssueModalProps) {
    const [formData, setFormData] = useState<Omit<ReportLockerIssueRequest, 'lockerId'> & { lockerId: string }>({
        lockerId: defaultLockerId ?? '',
        issueType: '',
        severity: 'MEDIUM',
        title: '',
        description: '',
        reportedBy: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            lockerId: defaultLockerId ?? '',
        }));
    }, [defaultLockerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await lockerAdminRepository.reportIssue(formData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create issue');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Report New Issue</h2>
                                <p className="text-sm text-gray-500">Create a new support ticket for a locker</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-red-900">Error Creating Issue</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Locker ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Locker ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.lockerId}
                                onChange={(e) => handleChange('lockerId', e.target.value)}
                                placeholder="e.g., 850e8400-e29b-41d4-a716-446655440100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {lockerCode
                                    ? `Reporting issue for ${lockerCode}. Update the locker ID if you need a different locker.`
                                    : 'Enter the UUID of the affected locker'}
                            </p>
                        </div>

                        {/* Issue Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.issueType}
                                onChange={(e) => handleChange('issueType', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select issue type...</option>
                                {ISSUE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Severity <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {SEVERITY_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleChange('severity', option.value)}
                                        className={cn(
                                            'px-4 py-3 rounded-lg border-2 font-medium transition-all',
                                            formData.severity === option.value
                                                ? option.color + ' ring-2 ring-offset-2'
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Brief description of the issue"
                                maxLength={100}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.title.length}/100 characters
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Detailed Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={5}
                                placeholder="Provide detailed information about the issue, including what happened, when it occurred, and any relevant details..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Reported By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reported By <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.reportedBy}
                                onChange={(e) => handleChange('reportedBy', e.target.value)}
                                placeholder="Your name or technician ID"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                                    isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Create Issue
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateIssueModal;