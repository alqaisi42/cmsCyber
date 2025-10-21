// src/presentation/hooks/useOrders.ts
// React Query hooks for working with the order flow service

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/infrastructure/services/orders.service';
import {
    AdminOrderStatistics,
    AdminStatisticsQuery,
    AmountRangeQuery,
    AssignDeliveryRequest,
    AttentionOrderEntry,
    CancelOrderRequest,
    CheckoutSummaryParams,
    CheckoutValidationPayload,
    CreateOrderRequest,
    DateRangeQuery,
    ForceCancelRequest,
    KeywordSearchQuery,
    LiveLocationInfo,
    LockerAccessRequest,
    LockerAvailabilityParams,
    LockerAvailabilityResult,
    ManualStatusUpdateRequest,
    OrderCompletionFeedback,
    OrderDetail,
    OrderHistoryEntry,
    OrderSearchQuery,
    OrderStatistics,
    OrderSummary,
    OrderTrackingInfo,
    UpdateOrderStatusRequest,
    UserProposalDecision,
    VendorDecisionRequest,
    VendorProposalRequest,
} from '@/core/entities/orders';

interface OrderSearchResult {
    orders: OrderSummary[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    appliedFilters?: Record<string, unknown>;
}

function sanitizeSearchFilters(filters: OrderSearchQuery): OrderSearchQuery {
    const sanitized: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        sanitized[key] = value;
    });
    return sanitized;
}

export function useOrderStatistics() {
    return useQuery<OrderStatistics, Error>({
        queryKey: ['orders', 'stats'],
        queryFn: async () => {
            const response = await ordersService.getOrderStats();
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useAdminOrderStatistics(query: AdminStatisticsQuery = {}) {
    const sanitized = useMemo(() => sanitizeSearchFilters(query), [query]);
    return useQuery<AdminOrderStatistics, Error>({
        queryKey: ['orders', 'admin-stats', sanitized],
        queryFn: async () => {
            const response = await ordersService.getAdminStatistics(sanitized);
            return response.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useOrdersRequiringAttention() {
    return useQuery<AttentionOrderEntry[], Error>({
        queryKey: ['orders', 'attention'],
        queryFn: async () => {
            const response = await ordersService.getOrdersRequiringAttention();
            return response.data;
        },
        staleTime: 60 * 1000,
    });
}

export function useOrderSearch(filters: OrderSearchQuery, enabled: boolean = true) {
    const sanitized = useMemo(() => sanitizeSearchFilters(filters), [filters]);
    return useQuery<OrderSearchResult, Error>({
        queryKey: ['orders', 'search', sanitized],
        queryFn: async () => {
            // If keyword search only, use dedicated endpoint
            const keywordOnly =
                !!sanitized.keyword &&
                Object.keys(sanitized).filter((key) => key !== 'keyword').length === 0;

            if (keywordOnly) {
                const response = await ordersService.searchOrdersByKeyword({
                    keyword: sanitized.keyword as string,
                    page: sanitized.page,
                    size: sanitized.size,
                });
                return {
                    orders: response.data.orders,
                    totalElements: response.data.totalElements ?? response.data.orders.length,
                    totalPages: response.data.totalPages ?? 1,
                    currentPage: sanitized.page ?? 0,
                    pageSize: sanitized.size ?? response.data.orders.length ?? 20,
                };
            }

            const response = await ordersService.searchOrders(sanitized);
            return response.data;
        },
        keepPreviousData: true,
        enabled,
    });
}

export function useOrderDetails(orderId?: string) {
    return useQuery<OrderDetail, Error>({
        queryKey: ['orders', 'details', orderId],
        queryFn: async () => {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            const response = await ordersService.getOrderDetails(orderId);
            return response.data;
        },
        enabled: !!orderId,
    });
}

export function useOrderHistory(orderId?: string, userId?: number) {
    return useQuery<OrderHistoryEntry[], Error>({
        queryKey: ['orders', 'history', orderId, userId],
        queryFn: async () => {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            const response = await ordersService.getOrderHistory(orderId, userId);
            return response.data;
        },
        enabled: !!orderId,
    });
}

export function useOrderTracking(orderId?: string, enabled: boolean = true) {
    return useQuery<OrderTrackingInfo, Error>({
        queryKey: ['orders', 'tracking', orderId],
        queryFn: async () => {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            const response = await ordersService.getTracking(orderId);
            return response.data;
        },
        enabled: !!orderId && enabled,
    });
}

export function useLiveLocation(orderId?: string, enabled: boolean = false) {
    return useQuery<LiveLocationInfo, Error>({
        queryKey: ['orders', 'live-location', orderId],
        queryFn: async () => {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            const response = await ordersService.getLiveLocation(orderId);
            return response.data;
        },
        enabled: !!orderId && enabled,
        refetchInterval: enabled ? 15000 : false,
    });
}

// ------------------------------------------------------
// Mutations - helper to invalidate common queries
// ------------------------------------------------------
function useInvalidateOrderQueries(orderId?: string) {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['orders', 'search'] });
        if (orderId) {
            queryClient.invalidateQueries({ queryKey: ['orders', 'details', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders', 'history', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders', 'tracking', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders', 'live-location', orderId] });
        }
    };
}

export function useCreateOrder() {
    const invalidate = useInvalidateOrderQueries();
    return useMutation({
        mutationFn: (payload: CreateOrderRequest) => ordersService.createOrder(payload),
        onSuccess: () => invalidate(),
    });
}

export function useValidateCheckout() {
    return useMutation({
        mutationFn: ({ userId, payload }: { userId: number; payload?: CheckoutValidationPayload }) =>
            ordersService.validateCheckout(userId, payload),
    });
}

export function useLockerAvailability() {
    return useMutation({
        mutationFn: (payload: LockerAvailabilityParams) => ordersService.checkLockerAvailability(payload),
    });
}

export function useCheckoutSummary() {
    return useMutation({
        mutationFn: (payload: CheckoutSummaryParams) => ordersService.getCheckoutSummary(payload),
    });
}

export function useVendorAccept() {
    const invalidate = useInvalidateOrderQueries();
    return useMutation({
        mutationFn: (payload: VendorDecisionRequest) => ordersService.vendorAcceptOrder(payload),
        onSuccess: () => invalidate(),
    });
}

export function useVendorReject() {
    const invalidate = useInvalidateOrderQueries();
    return useMutation({
        mutationFn: (payload: VendorDecisionRequest) => ordersService.vendorRejectOrder(payload),
        onSuccess: () => invalidate(),
    });
}

export function useVendorProposeChanges() {
    const invalidate = useInvalidateOrderQueries();
    return useMutation({
        mutationFn: (payload: VendorProposalRequest) => ordersService.vendorProposeChanges(payload),
        onSuccess: () => invalidate(),
    });
}

export function useUserAcceptProposal() {
    const invalidate = useInvalidateOrderQueries();
    return useMutation({
        mutationFn: (payload: UserProposalDecision) => ordersService.userAcceptProposal(payload),
        onSuccess: () => invalidate(),
    });
}

export function useUserRejectProposal() {
    const invalidate = useInvalidateOrderQueries();
    return useMutation({
        mutationFn: (payload: UserProposalDecision) => ordersService.userRejectProposal(payload),
        onSuccess: () => invalidate(),
    });
}

export function useVendorStartPreparation(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, vendorId }: { orderId: string; vendorId: string }) =>
            ordersService.vendorStartPreparation(id, vendorId),
        onSuccess: () => invalidate(),
    });
}

export function useVendorMarkReady(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, vendorId }: { orderId: string; vendorId: string }) =>
            ordersService.vendorMarkReady(id, vendorId),
        onSuccess: () => invalidate(),
    });
}

export function useAssignDelivery(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, payload }: { orderId: string; payload: AssignDeliveryRequest }) =>
            ordersService.assignDelivery(id, payload),
        onSuccess: () => invalidate(),
    });
}

export function useConfirmPickup(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, deliveryPersonId }: { orderId: string; deliveryPersonId: number }) =>
            ordersService.confirmPickup(id, deliveryPersonId),
        onSuccess: () => invalidate(),
    });
}

export function useStartDelivery(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, deliveryPersonId }: { orderId: string; deliveryPersonId: number }) =>
            ordersService.startDelivery(id, deliveryPersonId),
        onSuccess: () => invalidate(),
    });
}

export function useOpenLocker(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({
            orderId: id,
            deliveryPersonId,
            accessCode,
        }: {
            orderId: string;
            deliveryPersonId: number;
            accessCode: string;
        }) => ordersService.openLocker(id, deliveryPersonId, accessCode),
        onSuccess: () => invalidate(),
    });
}

export function useCustomerLockerAccess(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, userId, payload }: { orderId: string; userId: number; payload: LockerAccessRequest }) =>
            ordersService.customerLockerAccess(id, userId, payload),
        onSuccess: () => invalidate(),
    });
}

export function useCompleteOrder(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, userId, payload }: { orderId: string; userId: number; payload: OrderCompletionFeedback }) =>
            ordersService.completeOrder(id, userId, payload),
        onSuccess: () => invalidate(),
    });
}

export function useUserConfirmReceipt(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, userId }: { orderId: string; userId: number }) =>
            ordersService.userConfirmReceipt(id, userId),
        onSuccess: () => invalidate(),
    });
}

export function useUpdateOrderStatus(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, payload }: { orderId: string; payload: UpdateOrderStatusRequest }) =>
            ordersService.updateOrderStatus(id, payload),
        onSuccess: () => invalidate(),
    });
}

export function useCancelOrder(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, payload }: { orderId: string; payload: CancelOrderRequest }) =>
            ordersService.cancelOrder(id, payload),
        onSuccess: () => invalidate(),
    });
}

export function useForceCancelOrder(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, payload }: { orderId: string; payload: ForceCancelRequest }) =>
            ordersService.forceCancelOrder(id, payload),
        onSuccess: () => invalidate(),
    });
}

export function useManualStatusUpdate(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, payload }: { orderId: string; payload: ManualStatusUpdateRequest }) =>
            ordersService.manualStatusUpdate(id, payload),
        onSuccess: () => invalidate(),
    });
}

export function useMarkDelivered(orderId?: string) {
    const invalidate = useInvalidateOrderQueries(orderId);
    return useMutation({
        mutationFn: ({ orderId: id, deliveryPersonId }: { orderId: string; deliveryPersonId: number }) =>
            ordersService.markDelivered(id, deliveryPersonId),
        onSuccess: () => invalidate(),
    });
}

export function useSubscribeToTracking() {
    return useMutation({
        mutationFn: ({ orderId, userId }: { orderId: string; userId: number }) =>
            ordersService.subscribeToTracking(orderId, userId),
    });
}

export function useOrdersByDateRange(query: DateRangeQuery, enabled: boolean = true) {
    const sanitized = useMemo(() => sanitizeSearchFilters(query), [query]);
    return useQuery<{ orders: OrderSummary[]; totalElements: number; totalPages: number }, Error>({
        queryKey: ['orders', 'date-range', sanitized],
        queryFn: async () => {
            const response = await ordersService.getOrdersByDateRange(sanitized as DateRangeQuery);
            return response.data;
        },
        enabled,
    });
}

export function useOrdersByAmountRange(query: AmountRangeQuery, enabled: boolean = true) {
    const sanitized = useMemo(() => sanitizeSearchFilters(query), [query]);
    return useQuery<{ orders: OrderSummary[]; totalElements: number; totalPages: number }, Error>({
        queryKey: ['orders', 'amount-range', sanitized],
        queryFn: async () => {
            const response = await ordersService.getOrdersByAmountRange(sanitized as AmountRangeQuery);
            return response.data;
        },
        enabled,
    });
}

export function useKeywordSearch(query: KeywordSearchQuery, enabled: boolean = true) {
    const sanitized = useMemo(() => sanitizeSearchFilters(query), [query]);
    return useQuery<{ orders: OrderSummary[]; totalElements: number; totalPages: number }, Error>({
        queryKey: ['orders', 'keyword', sanitized],
        queryFn: async () => {
            const response = await ordersService.searchOrdersByKeyword(sanitized as KeywordSearchQuery);
            return response.data;
        },
        enabled,
    });
}

