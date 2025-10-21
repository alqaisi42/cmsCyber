// src/presentation/components/orders/OrderStatusBadge.tsx

import { OrderStatus } from '@/core/entities/orders';
import { cn } from '@/shared/utils/cn';

interface OrderStatusBadgeProps {
    status: OrderStatus | string;
    className?: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    REQUESTED: {
        label: 'Requested',
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    VENDOR_ACCEPTED: {
        label: 'Vendor Accepted',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
    VENDOR_REJECTED: {
        label: 'Vendor Rejected',
        className: 'bg-red-100 text-red-700 border border-red-200',
    },
    NEGOTIATING: {
        label: 'Negotiating',
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    CONFIRMED: {
        label: 'Confirmed',
        className: 'bg-blue-100 text-blue-700 border border-blue-200',
    },
    PREPARING: {
        label: 'Preparing',
        className: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    },
    READY_FOR_DELIVERY: {
        label: 'Ready for Delivery',
        className: 'bg-sky-100 text-sky-700 border border-sky-200',
    },
    ASSIGNED: {
        label: 'Assigned',
        className: 'bg-purple-100 text-purple-700 border border-purple-200',
    },
    PICKED_UP: {
        label: 'Picked Up',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
    IN_TRANSIT: {
        label: 'In Transit',
        className: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    },
    DELIVERED: {
        label: 'Delivered',
        className: 'bg-green-100 text-green-700 border border-green-200',
    },
    COMPLETED: {
        label: 'Completed',
        className: 'bg-teal-100 text-teal-700 border border-teal-200',
    },
    CANCELLED: {
        label: 'Cancelled',
        className: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
    const style = STATUS_STYLES[status] ?? {
        label: status
            .toString()
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' '),
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide',
                style.className,
                className,
            )}
        >
            <span className="inline-flex h-2 w-2 rounded-full bg-current/50" />
            {style.label}
        </span>
    );
}
