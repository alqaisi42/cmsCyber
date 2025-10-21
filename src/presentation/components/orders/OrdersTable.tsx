// src/presentation/components/orders/OrdersTable.tsx

'use client';

import { Loader2, PackageSearch, User, Store, Calendar, ArrowUpRight } from 'lucide-react';
import { OrderSummary } from '@/core/entities/orders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { cn, formatCurrency, formatDate } from '@/shared/utils/cn';

interface OrdersTableProps {
    orders: OrderSummary[];
    loading?: boolean;
    selectedOrderId?: string | null;
    onSelectOrder?: (orderId: string) => void;
    page?: number;
    totalPages?: number;
    totalElements?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function OrdersTable({
    orders,
    loading,
    selectedOrderId,
    onSelectOrder,
    page = 0,
    totalPages = 0,
    totalElements,
    pageSize = 20,
    onPageChange,
    onPageSizeChange,
}: OrdersTableProps) {
    const handleRowClick = (orderId: string) => {
        if (onSelectOrder) {
            onSelectOrder(orderId);
        }
    };

    const hasResults = orders && orders.length > 0;
    const totalItems = totalElements ?? totalPages * pageSize;
    const showingFrom = totalItems === 0 ? 0 : page * pageSize + 1;
    const showingTo = totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <PackageSearch className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Orders Overview</h2>
                        <p className="text-sm text-slate-600">Track user and provider orders with live status updates.</p>
                    </div>
                </div>
                <div className="text-sm text-slate-500">
                    Page <span className="font-medium text-slate-700">{page + 1}</span> of{' '}
                    <span className="font-medium text-slate-700">{Math.max(totalPages, 1)}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Order</th>
                        <th className="px-6 py-3">Customer / Vendor</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Financials</th>
                        <th className="px-6 py-3">Delivery</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {loading && (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                    <span className="text-sm">Fetching orders...</span>
                                </div>
                            </td>
                        </tr>
                    )}

                    {!loading && !hasResults && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-3 text-slate-500">
                                    <PackageSearch className="w-8 h-8" />
                                    <p className="font-medium">No orders match the current filters</p>
                                    <p className="text-sm">Try adjusting your search criteria or date range.</p>
                                </div>
                            </td>
                        </tr>
                    )}

                    {!loading && hasResults && orders.map((order) => {
                        const isSelected = selectedOrderId === order.id;
                        const fullId = order.id ?? '—';
                        const shortId = fullId !== '—' ? fullId.slice(0, 8) : '—';
                        return (
                            <tr
                                key={fullId}
                                onClick={() => fullId !== '—' && handleRowClick(fullId)}
                                className={cn(
                                    'cursor-pointer transition-colors hover:bg-blue-50/40',
                                    isSelected ? 'bg-blue-50/60' : 'bg-white'
                                )}
                            >
                                <td className="px-6 py-4 align-top">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            #{shortId}
                                            <span className="text-xs font-medium text-slate-400">{fullId}</span>
                                        </p>
                                        <p className="text-xs text-slate-500">Created {formatDate(order.createdAt ?? order.updatedAt ?? new Date())}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="flex flex-col gap-2 text-sm text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                                <User className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-900">{order.userName ?? `User #${order.userId}`}</p>
                                                <p className="text-xs text-slate-500">ID: {order.userId}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                                <Store className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-900">{order.vendorName ?? 'Vendor'}</p>
                                                <p className="text-xs text-slate-500">ID: {order.vendorId}</p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="space-y-2">
                                        <OrderStatusBadge status={order.status} />
                                        <div className="text-xs text-slate-500">
                                            <p>Payment: <span className="font-medium text-slate-700">{order.paymentStatus}</span></p>
                                            {order.updatedAt && (
                                                <p>Updated {formatDate(order.updatedAt, 'time')}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="space-y-2 text-sm">
                                        <p className="font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                                        <div className="text-xs text-slate-500 space-y-1">
                                            {order.subtotal !== undefined && <p>Subtotal: {formatCurrency(order.subtotal)}</p>}
                                            {order.taxAmount !== undefined && <p>Tax: {formatCurrency(order.taxAmount)}</p>}
                                            {order.deliveryFee !== undefined && <p>Delivery: {formatCurrency(order.deliveryFee)}</p>}
                                            {order.discountAmount !== undefined && order.discountAmount > 0 && (
                                                <p>Discount: -{formatCurrency(order.discountAmount)}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="space-y-2 text-sm text-slate-600">
                                        {order.deliveryTime && (
                                            <p className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                {formatDate(order.deliveryTime, 'time')}
                                            </p>
                                        )}
                                        {order.estimatedDelivery && (
                                            <p className="text-xs text-slate-500">ETA: {formatDate(order.estimatedDelivery, 'time')}</p>
                                        )}
                                        {order.deliveryAddress && (
                                            <p className="text-xs text-slate-500 line-clamp-2">{order.deliveryAddress}</p>
                                        )}
                                        {order.lockerId && (
                                            <p className="text-xs text-slate-500">Locker #{order.lockerId}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right align-top">
                                    <button
                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        View details
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <span className="ml-2">
                        Showing {showingFrom} - {showingTo}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => onPageChange?.(Math.max(page - 1, 0))}
                        disabled={page <= 0}
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600">
                        {page + 1} / {Math.max(totalPages, 1)}
                    </span>
                    <button
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => onPageChange?.(Math.min(page + 1, Math.max(totalPages - 1, 0)))}
                        disabled={page + 1 >= Math.max(totalPages, 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
