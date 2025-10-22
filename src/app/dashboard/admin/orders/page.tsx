// src/app/dashboard/admin/orders/page.tsx
'use client';

import {useEffect, useMemo, useState} from 'react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ClipboardList,
    Clock,
    Filter,
    Layers,
    Loader2,
    MapPin,
    PackagePlus,
    RefreshCw,
    Search,
    ShieldCheck,
    Truck,
    Users,
    X,
} from 'lucide-react';
import {
    useAdminOrderStatistics,
    useAssignDelivery,
    useCancelOrder,
    useCheckoutSummary,
    useConfirmPickup,
    useCreateOrder,
    useForceCancelOrder,
    useLiveLocation,
    useLockerAvailability,
    useManualStatusUpdate,
    useMarkDelivered,
    useOrderDetails,
    useOrderHistory,
    useOrderSearch,
    useOrderStatistics,
    useOrderTracking,
    useOrdersRequiringAttention,
    useStartDelivery,
    useUpdateOrderStatus,
    useValidateCheckout,
    useVendorMarkReady,
    useVendorStartPreparation,
    useCompleteOrder,
    useUserConfirmReceipt,
    useVendorAccept,
    useVendorReject,
} from '@/presentation/hooks/useOrders';
import {StatsCard} from '@/presentation/components/ui/StatsCard';
import {OrdersTable} from '@/presentation/components/orders/OrdersTable';
import {OrderStatusBadge} from '@/presentation/components/orders/OrderStatusBadge';
import {
    AssignDeliveryRequest,
    CreateOrderRequest,
    ForceCancelRequest,
    ManualStatusUpdateRequest,
    OrderCompletionFeedback,
    OrderStatus,
    UpdateOrderStatusRequest,
} from '@/core/entities/orders';
import {formatCurrency, formatDate} from '@/shared/utils/cn';
import { useToast } from '@/presentation/components/ui/toast';
import { lockerManagementService } from '@/infrastructure/services/locker-management.service';
import type { LockerLocation } from '@/core/entities/lockers';

const ORDER_STATUSES: OrderStatus[] = [
    'REQUESTED',
    'VENDOR_ACCEPTED',
    'NEGOTIATING',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_DELIVERY',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
];

const ADMIN_PERIODS = [
    {value: 'LAST_7_DAYS', label: 'Last 7 days'},
    {value: 'LAST_30_DAYS', label: 'Last 30 days'},
    {value: 'LAST_90_DAYS', label: 'Last 90 days'},
    {value: 'THIS_MONTH', label: 'This month'},
    {value: 'LAST_MONTH', label: 'Last month'},
    {value: 'ALL_TIME', label: 'All time'},
];

interface ActionResultState {
    message: string | null;
    error: string | null;
}

function useActionFeedback(): [ActionResultState, (message: string) => void, (error: string) => void, () => void] {
    const [state, setState] = useState<ActionResultState>({message: null, error: null});
    const setMessage = (message: string) => setState({message, error: null});
    const setError = (error: string) => setState({message: null, error});
    const clear = () => setState({message: null, error: null});
    return [state, setMessage, setError, clear];
}

export default function AdminOrdersPage() {
    const { pushToast } = useToast();
    const [statusFilter, setStatusFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [vendorIdFilter, setVendorIdFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [keyword, setKeyword] = useState('');
    const [period, setPeriod] = useState('LAST_30_DAYS');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
    const [showFlowTools, setShowFlowTools] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [checkoutUserId, setCheckoutUserId] = useState('');
    const [lockerParams, setLockerParams] = useState({
        userId: '',
        locationId: '',
        requiredSize: 'MEDIUM',
    });
    const [lockerLocations, setLockerLocations] = useState<LockerLocation[]>([]);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [createOrderPayload, setCreateOrderPayload] = useState<CreateOrderRequest>({
        userId: 0,
        vendorId: '',
        locationId: '',
        lockerId: '',
        deliveryTime: '',
        deliveryAddress: '',
        paymentMethod: 'CREDIT_CARD',
        deliveryNotes: '',
        promoCode: '',
    });

    const [actionState, setActionMessage, setActionError, clearActionState] = useActionFeedback();

    useEffect(() => {
        let isMounted = true;

        const loadLocations = async () => {
            setLocationsLoading(true);
            try {
                const response = await lockerManagementService.getLocations();
                if (!isMounted) {
                    return;
                }
                setLockerLocations(response.data || []);

                if (response.errors?.includes('FALLBACK_DATA')) {
                    pushToast({
                        type: 'warning',
                        title: 'Using fallback locker locations',
                        description: response.message || 'Showing cached locker locations until live data becomes available.',
                    });
                }
            } catch (error) {
                if (!isMounted) {
                    return;
                }
                const message = error instanceof Error ? error.message : 'Unable to load locker locations.';
                pushToast({
                    type: 'error',
                    title: 'Failed to load locker locations',
                    description: message,
                });
            } finally {
                if (isMounted) {
                    setLocationsLoading(false);
                }
            }
        };

        loadLocations();

        return () => {
            isMounted = false;
        };
    }, [pushToast]);

    const selectedLockerLocation = useMemo(
        () => lockerLocations.find((location) => location.id === lockerParams.locationId),
        [lockerLocations, lockerParams.locationId]
    );

    const searchFilters = useMemo(() => {
        const parsedUserId = userIdFilter ? Number(userIdFilter) : undefined;
        const parsedMinAmount = minAmount ? Number(minAmount) : undefined;
        const parsedMaxAmount = maxAmount ? Number(maxAmount) : undefined;

        return {
            status: (statusFilter as OrderStatus) || undefined,
            userId: parsedUserId && !Number.isNaN(parsedUserId) ? parsedUserId : undefined,
            vendorId: vendorIdFilter || undefined,
            createdFrom: dateFrom || undefined,
            createdTo: dateTo || undefined,
            minAmount: parsedMinAmount && !Number.isNaN(parsedMinAmount) ? parsedMinAmount : undefined,
            maxAmount: parsedMaxAmount && !Number.isNaN(parsedMaxAmount) ? parsedMaxAmount : undefined,
            keyword: keyword || undefined,
            page,
            size: pageSize,
        };
    }, [statusFilter, userIdFilter, vendorIdFilter, dateFrom, dateTo, minAmount, maxAmount, keyword, page, pageSize]);

    const {data: stats} = useOrderStatistics();
    const {data: adminStats} = useAdminOrderStatistics({period});
    const {data: attentionOrders} = useOrdersRequiringAttention();
    const {data: searchResult, isLoading: searchLoading} = useOrderSearch(searchFilters, true);

    const {data: orderDetails, isLoading: detailsLoading} = useOrderDetails(selectedOrderId);
    const selectedUserId = orderDetails?.order.userId;
    const {data: orderHistory, isLoading: historyLoading} = useOrderHistory(selectedOrderId, selectedUserId);
    const {data: trackingInfo, isLoading: trackingLoading} = useOrderTracking(selectedOrderId, true);
    const {data: liveLocation} = useLiveLocation(selectedOrderId, orderDetails?.order.status === 'IN_TRANSIT');

    const updateStatusMutation = useUpdateOrderStatus(selectedOrderId);
    const cancelOrderMutation = useCancelOrder(selectedOrderId);
    const forceCancelMutation = useForceCancelOrder(selectedOrderId);
    const manualStatusMutation = useManualStatusUpdate(selectedOrderId);
    const assignDeliveryMutation = useAssignDelivery(selectedOrderId);
    const confirmPickupMutation = useConfirmPickup(selectedOrderId);
    const startDeliveryMutation = useStartDelivery(selectedOrderId);
    const markDeliveredMutation = useMarkDelivered(selectedOrderId);
    const vendorStartPrepMutation = useVendorStartPreparation(selectedOrderId);
    const vendorReadyMutation = useVendorMarkReady(selectedOrderId);
    const completeOrderMutation = useCompleteOrder(selectedOrderId);
    const confirmReceiptMutation = useUserConfirmReceipt(selectedOrderId);
    const vendorAcceptMutation = useVendorAccept();
    const vendorRejectMutation = useVendorReject();

    const validateCheckoutMutation = useValidateCheckout();
    const lockerAvailabilityMutation = useLockerAvailability();
    const checkoutSummaryMutation = useCheckoutSummary();
    const createOrderMutation = useCreateOrder();

    const lockerAvailabilityData = lockerAvailabilityMutation.data?.data;
    const lockerAvailabilityMessage = lockerAvailabilityMutation.data?.message;

    const resetPagination = () => setPage(0);

    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        resetPagination();
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setUserIdFilter('');
        setVendorIdFilter('');
        setDateFrom('');
        setDateTo('');
        setMinAmount('');
        setMaxAmount('');
        setKeyword('');
        resetPagination();
    };

    const handleAction = async (action: () => Promise<any>, successMessage: string) => {
        try {
            clearActionState();
            const result = await action();
            setActionMessage(successMessage);
            if (successMessage) {
                pushToast({
                    type: 'success',
                    title: successMessage,
                });
            }
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Action failed';
            setActionError(message);
            pushToast({
                type: 'error',
                title: 'Action failed',
                description: message,
            });
        }
    };

    const onCloseDetails = () => {
        setSelectedOrderId(undefined);
        clearActionState();
    };

    const handleCreateOrderSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await handleAction(
            async () => {
                const payload: CreateOrderRequest = {
                    ...createOrderPayload,
                    userId: Number(createOrderPayload.userId),
                    promoCode: createOrderPayload.promoCode || undefined,
                    deliveryNotes: createOrderPayload.deliveryNotes || undefined,
                };
                await createOrderMutation.mutateAsync(payload);
                setShowCreateModal(false);
            },
            'Order created successfully'
        );
    };

    const handleValidateCheckout = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = checkoutUserId.trim();
        const userId = Number(trimmed);
        if (!trimmed || Number.isNaN(userId) || userId <= 0) {
            const errorMessage = 'Please provide a valid user ID for checkout validation.';
            setActionError(errorMessage);
            pushToast({
                type: 'error',
                title: 'Invalid checkout data',
                description: errorMessage,
            });
            return;
        }
        await handleAction(
            async () => validateCheckoutMutation.mutateAsync({userId}),
            'Checkout validation completed'
        );
    };

    const handleLockerAvailability = async (event: React.FormEvent) => {
        event.preventDefault();
        const numericUserId = Number(lockerParams.userId.trim());
        const payload = {
            userId: numericUserId,
            locationId: lockerParams.locationId,
            requiredSize: lockerParams.requiredSize || undefined,
        };
        if (!payload.userId || Number.isNaN(payload.userId)) {
            const errorMessage = 'Enter a valid user ID to check locker availability.';
            setActionError(errorMessage);
            pushToast({
                type: 'error',
                title: 'Invalid locker request',
                description: errorMessage,
            });
            return;
        }
        if (!payload.locationId) {
            const errorMessage = 'Select a locker location before checking availability.';
            setActionError(errorMessage);
            pushToast({
                type: 'error',
                title: 'Location required',
                description: errorMessage,
            });
            return;
        }
        await handleAction(
            async () => lockerAvailabilityMutation.mutateAsync(payload),
            'Locker availability checked'
        );
    };

    const handleCheckoutSummary = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = checkoutUserId.trim();
        const userId = Number(trimmed);
        if (!trimmed || Number.isNaN(userId) || userId <= 0) {
            const errorMessage = 'Please provide a valid user ID to get checkout summary.';
            setActionError(errorMessage);
            pushToast({
                type: 'error',
                title: 'Invalid checkout data',
                description: errorMessage,
            });
            return;
        }
        await handleAction(
            async () => checkoutSummaryMutation.mutateAsync({
                userId,
                promoCode: createOrderPayload.promoCode || undefined
            }),
            'Checkout summary calculated'
        );
    };

    const handleAssignDelivery = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrderId) return;
        const formData = new FormData(event.currentTarget);
        const deliveryPersonId = Number(formData.get('deliveryPersonId') || '');
        const assignedBy = String(formData.get('assignedBy') || '');
        const notes = String(formData.get('notes') || '');
        if (!deliveryPersonId || !assignedBy) {
            setActionError('Delivery person ID and assigned by fields are required.');
            return;
        }
        const payload: AssignDeliveryRequest = {
            deliveryPersonId,
            assignedBy,
            notes: notes || undefined,
        };
        await handleAction(
            async () => assignDeliveryMutation.mutateAsync({orderId: selectedOrderId, payload}),
            'Delivery person assigned'
        );
        event.currentTarget.reset();
    };

    const handleStatusUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrderId) return;
        const formData = new FormData(event.currentTarget);
        const status = String(formData.get('status') || '');
        const reason = String(formData.get('reason') || '');
        const updatedBy = String(formData.get('updatedBy') || 'ADMIN');
        if (!status) {
            setActionError('Please select a status to update.');
            return;
        }
        const payload: UpdateOrderStatusRequest = {
            status: status as OrderStatus,
            reason: reason || undefined,
            updatedBy,
            userId: selectedUserId,
        };
        await handleAction(
            async () => updateStatusMutation.mutateAsync({orderId: selectedOrderId, payload}),
            'Order status updated'
        );
        event.currentTarget.reset();
    };

    const handleManualStatusUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrderId) return;
        const formData = new FormData(event.currentTarget);
        const newStatus = String(formData.get('newStatus') || '');
        const adminId = Number(formData.get('adminId') || '');
        const reason = String(formData.get('reason') || '');
        if (!newStatus || !adminId) {
            setActionError('Admin ID and new status are required for manual updates.');
            return;
        }
        const payload: ManualStatusUpdateRequest = {
            newStatus: newStatus as OrderStatus,
            adminId,
            reason: reason || undefined,
        };
        await handleAction(
            async () => manualStatusMutation.mutateAsync({orderId: selectedOrderId, payload}),
            'Order status manually updated'
        );
        event.currentTarget.reset();
    };

    const handleForceCancel = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrderId) return;
        const formData = new FormData(event.currentTarget);
        const adminId = Number(formData.get('adminId') || '');
        const reason = String(formData.get('reason') || '');
        if (!adminId || !reason) {
            setActionError('Provide both admin ID and reason to force cancel the order.');
            return;
        }
        const payload: ForceCancelRequest = {adminId, reason};
        await handleAction(
            async () => forceCancelMutation.mutateAsync({orderId: selectedOrderId, payload}),
            'Order force cancelled'
        );
        event.currentTarget.reset();
    };

    const handleCancelOrder = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrderId) return;
        const formData = new FormData(event.currentTarget);
        const reason = String(formData.get('reason') || '');
        const cancelledBy = String(formData.get('cancelledBy') || 'ADMIN');
        if (!reason) {
            setActionError('Reason is required to cancel the order.');
            return;
        }
        await handleAction(
            async () =>
                cancelOrderMutation.mutateAsync({
                    orderId: selectedOrderId,
                    payload: {
                        userId: selectedUserId ?? 0,
                        reason,
                        cancelledBy,
                    },
                }),
            'Order cancelled'
        );
        event.currentTarget.reset();
    };

    const handleQuickDeliveryAction = async (
        mutation: typeof confirmPickupMutation,
        deliveryPersonId: number,
        successMessage: string
    ) => {
        if (!selectedOrderId || !deliveryPersonId) {
            setActionError('Assign a delivery person before triggering delivery actions.');
            return;
        }
        await handleAction(
            async () => mutation.mutateAsync({orderId: selectedOrderId, deliveryPersonId}),
            successMessage
        );
    };

    const handleCompleteOrder = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrderId || !selectedUserId) {
            setActionError('Select an order with a valid user to complete it.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        const vendorRating = Number(formData.get('vendorRating') || '');
        const deliveryRating = Number(formData.get('deliveryRating') || '');
        const comment = String(formData.get('comment') || '');
        const payload: OrderCompletionFeedback = {
            vendorRating,
            deliveryRating,
            comment: comment || undefined,
            issues: [],
        };
        await handleAction(
            async () =>
                completeOrderMutation.mutateAsync({
                    orderId: selectedOrderId,
                    userId: selectedUserId,
                    payload,
                }),
            'Order marked as complete'
        );
        event.currentTarget.reset();
    };

    const handleConfirmReceipt = async () => {
        if (!selectedOrderId || !selectedUserId) return;
        await handleAction(
            async () => confirmReceiptMutation.mutateAsync({orderId: selectedOrderId, userId: selectedUserId}),
            'Receipt confirmed'
        );
    };

    const selectedOrder = orderDetails?.order;
    const orders = searchResult?.orders ?? [];
    const totalPages = searchResult?.totalPages ?? 0;
    const totalElements = searchResult?.totalPages ?? 0;

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-6 bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <ClipboardList className="w-8 h-8 text-blue-600"/>
                            Order Operations Hub
                        </h1>
                        <p className="text-slate-600 max-w-2xl mt-2">
                            Monitor every step of the order journey — from checkout validation to delivery confirmation.
                            Quickly
                            respond to issues, assist customers, and support providers in a single command center.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition"
                        >
                            <PackagePlus className="w-5 h-5"/>
                            New Order
                        </button>
                        <button
                            onClick={() => setShowFlowTools((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                        >
                            <Layers className="w-5 h-5"/>
                            Flow tools
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                        >
                            <RefreshCw className="w-5 h-5"/>
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Orders"
                        value={stats?.totalOrders ?? 0}
                        icon={<ClipboardList className="w-5 h-5"/>}
                        color="blue"
                    />
                    <StatsCard
                        title="Active Orders"
                        value={stats?.activeOrders ?? 0}
                        icon={<Clock className="w-5 h-5"/>}
                        color="purple"
                    />
                    <StatsCard
                        title="Completed"
                        value={stats?.completedOrders ?? 0}
                        icon={<CheckCircle2 className="w-5 h-5"/>}
                        color="green"
                    />
                    <StatsCard
                        title="Revenue"
                        value={formatCurrency(stats?.totalRevenue ?? 0)}
                        icon={<ShieldCheck className="w-5 h-5"/>}
                        color="yellow"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl p-5 shadow-md">
                        <p className="text-sm uppercase tracking-wide opacity-70">Admin insights</p>
                        <p className="text-3xl font-bold mt-2">{adminStats?.totalOrders ?? '—'}</p>
                        <p className="text-sm opacity-80 mt-1">Orders
                            in {ADMIN_PERIODS.find((p) => p.value === period)?.label.toLowerCase()}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <Users className="w-5 h-5"/>
                            <span className="text-sm">Customers: {adminStats?.customerCount ?? 0}</span>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Orders requiring attention</h3>
                            <AlertTriangle className="w-5 h-5 text-amber-500"/>
                        </div>
                        <p className="text-sm text-slate-600">
                            {attentionOrders?.length ? `${attentionOrders.length} escalation${attentionOrders.length > 1 ? 's' : ''}` : 'No escalations right now'}
                        </p>
                        {attentionOrders?.slice(0, 2).map((order) => (
                            <div key={order.id} className="border border-amber-200 rounded-xl px-3 py-2 bg-amber-50/70">
                                <div className="flex items-center justify-between text-xs">
                                    <span
                                        className="font-semibold text-amber-700">{order.issueType.replaceAll('_', ' ')}</span>
                                    <OrderStatusBadge status={order.status}/>
                                </div>
                                <p className="text-xs text-amber-700 mt-1 line-clamp-2">{order.issueDescription}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Admin period</label>
                        <select
                            value={period}
                            onChange={(event) => setPeriod(event.target.value)}
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ADMIN_PERIODS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md">
                        <p className="text-sm uppercase tracking-wide opacity-80">Live tracking</p>
                        {selectedOrderId ? (
                            <div className="mt-3 space-y-2 text-sm">
                                <p className="font-semibold">Order {selectedOrderId.slice(0, 8)}</p>
                                <p className="flex items-center gap-2 opacity-80">
                                    <Truck className="w-4 h-4"/>
                                    {trackingInfo?.currentStatus ?? 'Loading...'}
                                </p>
                                {liveLocation?.currentLocation && (
                                    <p className="text-xs opacity-75">
                                        Location: {liveLocation.currentLocation.latitude.toFixed(4)}, {liveLocation.currentLocation.longitude.toFixed(4)}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm opacity-70 mt-3">
                                Select an order to view live tracking and transit information.
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Keyword</label>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Search by address, notes, ID"
                                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as OrderStatus)}
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All statuses</option>
                            {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>

                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">User ID</label>
                        <input
                            value={userIdFilter}
                            onChange={(event) => setUserIdFilter(event.target.value)}
                            placeholder="e.g. 1"
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Vendor ID</label>
                        <input
                            value={vendorIdFilter}
                            onChange={(event) => setVendorIdFilter(event.target.value)}
                            placeholder="Vendor UUID"
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Date from</label>
                        <input
                            type="datetime-local"
                            value={dateFrom}
                            onChange={(event) => setDateFrom(event.target.value)}
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Date to</label>
                        <input
                            type="datetime-local"
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Min amount</label>
                        <input
                            value={minAmount}
                            onChange={(event) => setMinAmount(event.target.value)}
                            placeholder="e.g. 20"
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Max amount</label>
                        <input
                            value={maxAmount}
                            onChange={(event) => setMaxAmount(event.target.value)}
                            placeholder="e.g. 500"
                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-4 flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                            <Filter className="w-4 h-4"/>
                            Apply filters
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                        >
                            Clear
                        </button>
                        {keyword && (
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                Searching for <strong>{keyword}</strong>
                                <button
                                    type="button"
                                    onClick={() => setKeyword('')}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    reset
                                </button>
                            </p>
                        )}
                    </div>
                </form>
            </section>

            <OrdersTable
                orders={orders}
                loading={searchLoading}
                selectedOrderId={selectedOrderId}
                onSelectOrder={(id) => setSelectedOrderId(id)}
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize);
                    setPage(0);
                }}
            />

            {showFlowTools && (
                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Checkout & workflow tools</h2>
                            <p className="text-sm text-slate-600">Use these utilities to simulate or assist
                                user/provider actions.</p>
                        </div>
                        <button onClick={() => setShowFlowTools(false)} className="text-slate-500 hover:text-slate-700">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <form onSubmit={handleValidateCheckout}
                              className="border border-slate-200 rounded-2xl p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase">Validate checkout</h3>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">User ID</label>
                                <input
                                    value={checkoutUserId}
                                    onChange={(event) => setCheckoutUserId(event.target.value)}
                                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                disabled={validateCheckoutMutation.isPending}
                            >
                                {validateCheckoutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin"/>}
                                Validate
                            </button>
                            {validateCheckoutMutation.data && (
                                <div
                                    className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <p>Valid: {validateCheckoutMutation.data.data.isValid ? 'Yes' : 'No'}</p>
                                    {validateCheckoutMutation.data.data.issues?.length > 0 && (
                                        <ul className="list-disc ml-4 mt-2 space-y-1">
                                            {validateCheckoutMutation.data.data.issues.map((issue, index) => (
                                                <li key={index}>{issue}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </form>

                        <form onSubmit={handleLockerAvailability}
                              className="border border-slate-200 rounded-2xl p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase">Check locker availability</h3>
                            <p className="text-xs text-slate-500">Quickly verify if a locker is available for the selected user and location.</p>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">User ID</label>
                                    <input
                                        value={lockerParams.userId}
                                        onChange={(event) => setLockerParams((prev) => ({
                                            ...prev,
                                            userId: event.target.value
                                        }))}
                                        placeholder="e.g. 1024"
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Location</label>
                                    <select
                                        value={lockerParams.locationId}
                                        onChange={(event) => setLockerParams((prev) => ({
                                            ...prev,
                                            locationId: event.target.value
                                        }))}
                                        disabled={locationsLoading}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="">
                                            {locationsLoading ? 'Loading locations…' : 'Select a location'}
                                        </option>
                                        {lockerLocations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name} — {location.city}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedLockerLocation && (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {selectedLockerLocation.address}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Required size</label>
                                    <select
                                        value={lockerParams.requiredSize}
                                        onChange={(event) => setLockerParams((prev) => ({
                                            ...prev,
                                            requiredSize: event.target.value
                                        }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Any size</option>
                                        <option value="SMALL">Small</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="LARGE">Large</option>
                                        <option value="EXTRA_LARGE">Extra large</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                                disabled={lockerAvailabilityMutation.isPending}
                            >
                                {lockerAvailabilityMutation.isPending && <Loader2 className="w-4 h-4 animate-spin"/>}
                                Check availability
                            </button>
                            {lockerAvailabilityData && (
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                                    <div className={`flex items-center gap-2 text-sm font-semibold ${lockerAvailabilityData.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {lockerAvailabilityData.isAvailable ? (
                                            <CheckCircle2 className="h-4 w-4"/>
                                        ) : (
                                            <AlertTriangle className="h-4 w-4"/>
                                        )}
                                        {lockerAvailabilityData.isAvailable ? 'Lockers available' : 'No lockers available'}
                                    </div>
                                    <p className="text-[11px] uppercase text-slate-500">Total available: {lockerAvailabilityData.totalAvailable}</p>
                                    {lockerAvailabilityMessage && (
                                        <p className="text-[11px] text-slate-500">{lockerAvailabilityMessage}</p>
                                    )}
                                    {lockerAvailabilityData.availableLockers && lockerAvailabilityData.availableLockers.length > 0 && (
                                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                            <p className="text-[11px] font-semibold uppercase text-slate-500">Recommended lockers</p>
                                            <div className="space-y-2">
                                                {lockerAvailabilityData.availableLockers.map((locker) => (
                                                    <div
                                                        key={locker.lockerId}
                                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                                    >
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {locker.lockerName || locker.lockerCode}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{locker.locationName}</p>
                                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase text-slate-500">
                                                            <span>Size: {locker.size}</span>
                                                            <span>Status: {locker.status}</span>
                                                            {typeof locker.distanceKm === 'number' && (
                                                                <span>{locker.distanceKm.toFixed(1)} km away</span>
                                                            )}
                                                            {locker.subscriptionId && <span>Subscription: {locker.subscriptionId}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {lockerAvailabilityData.subscriptionInfo && (
                                        <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                            <p className="text-[11px] font-semibold uppercase text-emerald-600">Subscription details</p>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                                                <div>
                                                    <p className="font-semibold text-slate-900">Subscription</p>
                                                    <p>{lockerAvailabilityData.subscriptionInfo.subscriptionId}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">Role</p>
                                                    <p>{lockerAvailabilityData.subscriptionInfo.isOwner ? 'Owner' : 'Shared member'}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">Capacity</p>
                                                    <p>{lockerAvailabilityData.subscriptionInfo.remainingCapacity} / {lockerAvailabilityData.subscriptionInfo.totalCapacity}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">Active reservations</p>
                                                    <p>{lockerAvailabilityData.subscriptionInfo.activeReservations}</p>
                                                </div>
                                                {lockerAvailabilityData.subscriptionInfo.sharingType && (
                                                    <div className="col-span-2">
                                                        <p className="font-semibold text-slate-900">Sharing type</p>
                                                        <p>{lockerAvailabilityData.subscriptionInfo.sharingType}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {lockerAvailabilityData.unavailabilityReason && (
                                        <div className="rounded-lg border border-rose-200 bg-white p-3 text-rose-600">
                                            <p className="text-[11px] font-semibold uppercase">Reason</p>
                                            <p className="mt-1 text-xs">{lockerAvailabilityData.unavailabilityReason}</p>
                                        </div>
                                    )}
                                    {lockerAvailabilityData.suggestedActions && lockerAvailabilityData.suggestedActions.length > 0 && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                                            <p className="text-[11px] font-semibold uppercase text-slate-600">Suggested actions</p>
                                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                                                {lockerAvailabilityData.suggestedActions?.map((suggestion, index) => (
                                                    <li key={index}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>

                        <form onSubmit={handleCheckoutSummary}
                              className="border border-slate-200 rounded-2xl p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase">Checkout summary</h3>
                            <p className="text-xs text-slate-500">Uses the same user ID as validation.</p>
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                disabled={checkoutSummaryMutation.isPending}
                            >
                                {checkoutSummaryMutation.isPending && <Loader2 className="w-4 h-4 animate-spin"/>}
                                Get summary
                            </button>
                            {checkoutSummaryMutation.data && (
                                <div
                                    className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                                    <p>Items: {checkoutSummaryMutation.data.data.itemCount}</p>
                                    <p>Subtotal: {formatCurrency(checkoutSummaryMutation.data.data.subtotal)}</p>
                                    <p>Total: {formatCurrency(checkoutSummaryMutation.data.data.totalAmount)}</p>
                                </div>
                            )}
                        </form>
                    </div>
                </section>
            )}

            {selectedOrderId && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-end" onClick={onCloseDetails}>
                    {selectedOrder ? (
                        <div
                            className="w-full max-w-4xl h-full bg-white shadow-2xl overflow-y-auto"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Order details</p>
                                    <h2 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-3">
                                        #{selectedOrder.id?.slice(0, 8)}
                                        <OrderStatusBadge status={selectedOrder.status}/>
                                    </h2>
                                    <div className="text-sm text-slate-500 mt-2 flex flex-wrap gap-4">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4"/>
                                        {formatDate(selectedOrder.createdAt ?? new Date(), 'time')}
                                    </span>
                                        {selectedOrder.deliveryAddress && (
                                            <span className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4"/>
                                                {selectedOrder.deliveryAddress}
                                        </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={onCloseDetails} className="text-slate-500 hover:text-slate-700">
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {actionState.message && (
                                    <div
                                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {actionState.message}
                                    </div>
                                )}
                                {actionState.error && (
                                    <div
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {actionState.error}
                                    </div>
                                )}

                                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase">Financial
                                            summary</h3>
                                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            {selectedOrder.subtotal !== undefined && (
                                                <p>Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                                            )}
                                            {selectedOrder.taxAmount !== undefined && (
                                                <p>Tax: {formatCurrency(selectedOrder.taxAmount)}</p>
                                            )}
                                            {selectedOrder.deliveryFee !== undefined && (
                                                <p>Delivery fee: {formatCurrency(selectedOrder.deliveryFee)}</p>
                                            )}
                                            {selectedOrder.discountAmount !== undefined && selectedOrder.discountAmount > 0 && (
                                                <p>Discount: -{formatCurrency(selectedOrder.discountAmount)}</p>
                                            )}
                                            <p className="pt-2 text-xs uppercase text-slate-400">Payment
                                                status: {selectedOrder.paymentStatus}</p>
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase">Participants</h3>
                                        <div className="text-sm text-slate-600 space-y-2">
                                            <p className="font-semibold text-slate-900">Customer</p>
                                            <p>{selectedOrder.userName ?? `User #${selectedOrder.userId}`}</p>
                                            <p className="font-semibold text-slate-900 pt-2">Vendor</p>
                                            <p>{selectedOrder.vendorName ?? selectedOrder.vendorId}</p>
                                            {selectedOrder.deliveryPersonId && (
                                                <p className="pt-2 text-sm">Delivery
                                                    person: {selectedOrder.deliveryPersonId}</p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="border border-slate-200 rounded-2xl p-4">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase mb-4">Items</h3>
                                    <div className="space-y-3">
                                        {orderDetails?.items.map((item) => (
                                            <div
                                                key={`${item.productId}-${item.productName}`}
                                                className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                                                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-right text-sm text-slate-600">
                                                    <p>{formatCurrency(item.unitPrice)} ea</p>
                                                    <p className="font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="border border-slate-200 rounded-2xl p-4">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase mb-4">Timeline</h3>
                                    <div className="space-y-4">
                                        {trackingLoading && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Loader2 className="w-4 h-4 animate-spin"/>
                                                Loading timeline...
                                            </div>
                                        )}
                                        {!trackingLoading && trackingInfo?.timeline?.map((entry) => (
                                            <div key={`${entry.status}-${entry.timestamp}`}
                                                 className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{entry.status.replaceAll('_', ' ')}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(entry.timestamp, 'time')}</p>
                                                    {entry.description &&
                                                        <p className="text-xs text-slate-600 mt-1">{entry.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        {historyLoading && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Loader2 className="w-4 h-4 animate-spin"/>
                                                Loading history...
                                            </div>
                                        )}
                                        {!historyLoading && orderHistory?.map((entry) => (
                                            <div key={`${entry.status}-${entry.timestamp}-history`}
                                                 className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <div className="h-2 w-2 rounded-full bg-slate-400"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{entry.status.replaceAll('_', ' ')}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(entry.timestamp, 'time')}</p>
                                                    {entry.notes &&
                                                        <p className="text-xs text-slate-600 mt-1">{entry.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="border border-slate-200 rounded-2xl p-4 space-y-6">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase">Admin actions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <form onSubmit={handleStatusUpdate}
                                              className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Update
                                                status</p>
                                            <select
                                                name="status"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Select status
                                                </option>
                                                {ORDER_STATUSES.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status.replaceAll('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                name="updatedBy"
                                                defaultValue="ADMIN"
                                                placeholder="Updated by"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                name="reason"
                                                placeholder="Reason (optional)"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                {updateStatusMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Update status
                                            </button>
                                        </form>

                                        <form onSubmit={handleManualStatusUpdate}
                                              className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Manual
                                                override</p>
                                            <select
                                                name="newStatus"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Select status
                                                </option>
                                                {ORDER_STATUSES.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status.replaceAll('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                name="adminId"
                                                placeholder="Admin ID"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                name="reason"
                                                placeholder="Reason"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                                disabled={manualStatusMutation.isPending}
                                            >
                                                {manualStatusMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Manual update
                                            </button>
                                        </form>

                                        <form onSubmit={handleAssignDelivery}
                                              className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Assign
                                                delivery</p>
                                            <input
                                                name="deliveryPersonId"
                                                placeholder="Delivery person ID"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                name="assignedBy"
                                                placeholder="Assigned by"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                name="notes"
                                                placeholder="Notes"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                disabled={assignDeliveryMutation.isPending}
                                            >
                                                {assignDeliveryMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Assign
                                            </button>
                                        </form>

                                        <form onSubmit={handleForceCancel}
                                              className="border border-rose-200 bg-rose-50 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-rose-600 uppercase">Force
                                                cancel</p>
                                            <input
                                                name="adminId"
                                                placeholder="Admin ID"
                                                className="w-full border border-rose-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                            />
                                            <textarea
                                                name="reason"
                                                placeholder="Reason"
                                                className="w-full border border-rose-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                                                disabled={forceCancelMutation.isPending}
                                            >
                                                {forceCancelMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Force cancel
                                            </button>
                                        </form>

                                        <form onSubmit={handleCancelOrder}
                                              className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Standard
                                                cancel</p>
                                            <textarea
                                                name="reason"
                                                placeholder="Reason"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                name="cancelledBy"
                                                defaultValue="ADMIN"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                                                disabled={cancelOrderMutation.isPending}
                                            >
                                                {cancelOrderMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Cancel order
                                            </button>
                                        </form>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Delivery
                                                actions</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickDeliveryAction(confirmPickupMutation, selectedOrder.deliveryPersonId ?? 0, 'Pickup confirmed')}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={confirmPickupMutation.isPending}
                                                >
                                                    {confirmPickupMutation.isPending &&
                                                        <Loader2 className="w-4 h-4 animate-spin"/>}
                                                    Confirm pickup
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickDeliveryAction(startDeliveryMutation, selectedOrder.deliveryPersonId ?? 0, 'Delivery started')}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={startDeliveryMutation.isPending}
                                                >
                                                    {startDeliveryMutation.isPending &&
                                                        <Loader2 className="w-4 h-4 animate-spin"/>}
                                                    Start delivery
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickDeliveryAction(markDeliveredMutation, selectedOrder.deliveryPersonId ?? 0, 'Marked as delivered')}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={markDeliveredMutation.isPending}
                                                >
                                                    {markDeliveredMutation.isPending &&
                                                        <Loader2 className="w-4 h-4 animate-spin"/>}
                                                    Mark delivered
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Vendor
                                                simulation</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(
                                                        () => vendorStartPrepMutation.mutateAsync({
                                                            orderId: selectedOrderId!,
                                                            vendorId: selectedOrder.vendorId
                                                        }),
                                                        'Preparation started'
                                                    )}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={vendorStartPrepMutation.isPending}
                                                >
                                                    {vendorStartPrepMutation.isPending &&
                                                        <Loader2 className="w-4 h-4 animate-spin"/>}
                                                    Start prep
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(
                                                        () => vendorReadyMutation.mutateAsync({
                                                            orderId: selectedOrderId!,
                                                            vendorId: selectedOrder.vendorId
                                                        }),
                                                        'Marked ready'
                                                    )}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={vendorReadyMutation.isPending}
                                                >
                                                    {vendorReadyMutation.isPending &&
                                                        <Loader2 className="w-4 h-4 animate-spin"/>}
                                                    Ready for delivery
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(
                                                        () => vendorAcceptMutation.mutateAsync({
                                                            orderId: selectedOrderId!,
                                                            vendorId: selectedOrder.vendorId
                                                        }),
                                                        'Vendor accepted order'
                                                    )}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={vendorAcceptMutation.isPending}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(
                                                        () => vendorRejectMutation.mutateAsync({
                                                            orderId: selectedOrderId!,
                                                            vendorId: selectedOrder.vendorId,
                                                            reason: 'Admin trigger'
                                                        }),
                                                        'Vendor rejected order'
                                                    )}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                    disabled={vendorRejectMutation.isPending}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <form onSubmit={handleCompleteOrder}
                                              className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Complete order
                                                & feedback</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    name="vendorRating"
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    placeholder="Vendor rating"
                                                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    name="deliveryRating"
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    placeholder="Delivery rating"
                                                    className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <textarea
                                                name="comment"
                                                placeholder="Feedback"
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                disabled={completeOrderMutation.isPending}
                                            >
                                                {completeOrderMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Complete order
                                            </button>
                                        </form>
                                        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Customer
                                                receipt</p>
                                            <button
                                                type="button"
                                                onClick={handleConfirmReceipt}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                                disabled={confirmReceiptMutation.isPending}
                                            >
                                                {confirmReceiptMutation.isPending &&
                                                    <Loader2 className="w-4 h-4 animate-spin"/>}
                                                Confirm receipt
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="w-full max-w-4xl h-full bg-white shadow-2xl flex items-center justify-center"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                <Loader2 className="w-6 h-6 animate-spin"/>
                                <p className="text-sm">Loading order details...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60"
                     onClick={() => setShowCreateModal(false)}>
                    <div
                        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 space-y-4"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">Create order</h2>
                            <button onClick={() => setShowCreateModal(false)}
                                    className="text-slate-500 hover:text-slate-700">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrderSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">User ID</label>
                                <input
                                    value={createOrderPayload.userId || ''}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        userId: Number(event.target.value)
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Vendor ID</label>
                                <input
                                    value={createOrderPayload.vendorId}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        vendorId: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Location ID</label>
                                <input
                                    value={createOrderPayload.locationId}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        locationId: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Locker ID</label>
                                <input
                                    value={createOrderPayload.lockerId}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        lockerId: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Delivery time</label>
                                <input
                                    type="datetime-local"
                                    value={createOrderPayload.deliveryTime}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        deliveryTime: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Payment method</label>
                                <select
                                    value={createOrderPayload.paymentMethod}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        paymentMethod: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="CREDIT_CARD">Credit card</option>
                                    <option value="CASH">Cash</option>
                                    <option value="WALLET">Wallet</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Delivery
                                    address</label>
                                <textarea
                                    value={createOrderPayload.deliveryAddress}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        deliveryAddress: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Delivery notes</label>
                                <textarea
                                    value={createOrderPayload.deliveryNotes}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        deliveryNotes: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Promo code</label>
                                <input
                                    value={createOrderPayload.promoCode}
                                    onChange={(event) => setCreateOrderPayload((prev) => ({
                                        ...prev,
                                        promoCode: event.target.value
                                    }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    disabled={createOrderMutation.isPending}
                                >
                                    {createOrderMutation.isPending && <Loader2 className="w-4 h-4 animate-spin"/>}
                                    Create order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
