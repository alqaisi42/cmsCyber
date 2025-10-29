// src/presentation/components/locker-operations/BulkCreateLockersModal.tsx

'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { BulkCreateLockerPayload, LockerLocationDigest, LockerSubscriptionDigest } from '../../../core/entities/locker-operations';

interface BulkCreateLockersModalProps {
    isOpen: boolean;
    onClose: () => void;
    locations: LockerLocationDigest[];
    subscriptions: LockerSubscriptionDigest[];
    defaultLocationId?: string | null;
    onSubmit: (payload: BulkCreateLockerPayload) => Promise<void>;
}

const lockerSizes: BulkCreateLockerPayload['size'][] = ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'];

export function BulkCreateLockersModal({
    isOpen,
    onClose,
    locations,
    subscriptions,
    defaultLocationId,
    onSubmit,
}: BulkCreateLockersModalProps) {
    const [form, setForm] = useState<BulkCreateLockerPayload>(() => ({
        locationId: defaultLocationId ?? locations[0]?.id ?? '',
        subscriptionId: subscriptions[0]?.id ?? '',
        startNumber: 1,
        count: 10,
        size: 'MEDIUM',
        maxCapacity: 100,
    }));
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setForm({
            locationId: defaultLocationId ?? locations[0]?.id ?? '',
            subscriptionId: subscriptions[0]?.id ?? '',
            startNumber: 1,
            count: 10,
            size: 'MEDIUM',
            maxCapacity: 100,
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.locationId || !form.subscriptionId) {
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit(form);
            resetForm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const hasSubscriptionOptions = subscriptions.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Create Lockers" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Location
                        <select
                            required
                            value={form.locationId}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    locationId: e.target.value,
                                }))
                            }
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="" disabled>
                                Select location
                            </option>
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Subscription
                        {hasSubscriptionOptions ? (
                            <select
                                required
                                value={form.subscriptionId}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        subscriptionId: e.target.value,
                                    }))
                                }
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="" disabled>
                                    Select subscription
                                </option>
                                {subscriptions.map((subscription) => (
                                    <option key={subscription.id} value={subscription.id}>
                                        {subscription.name || subscription.id}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                required
                                value={form.subscriptionId}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        subscriptionId: e.target.value,
                                    }))
                                }
                                placeholder="Enter subscription ID"
                                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                        )}
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Start Number
                        <input
                            type="number"
                            min={1}
                            value={form.startNumber}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    startNumber: Number(e.target.value),
                                }))
                            }
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Count
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={form.count}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    count: Number(e.target.value),
                                }))
                            }
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Size
                        <select
                            value={form.size}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    size: e.target.value as BulkCreateLockerPayload['size'],
                                }))
                            }
                            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        >
                            {lockerSizes.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Max Capacity
                    <input
                        type="number"
                        min={1}
                        value={form.maxCapacity}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                maxCapacity: Number(e.target.value),
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
                        {submitting ? 'Creating...' : 'Create Lockers'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
