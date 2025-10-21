// src/infrastructure/services/orders.service.ts
// Centralized service for the complete order flow APIs

import {
    AmountRangeQuery,
    AssignDeliveryRequest,
    AttentionOrderEntry,
    CancelOrderRequest,
    CheckoutSummary,
    CheckoutSummaryParams,
    CheckoutValidationPayload,
    CheckoutValidationResult,
    CreateOrderRequest,
    DateRangeQuery,
    ForceCancelRequest,
    KeywordSearchQuery,
    LiveLocationInfo,
    LockerAccessRequest,
    LockerAvailabilityParams,
    LockerAvailabilityResult,
    ManualStatusUpdateRequest,
    OrderActor,
    OrderBasicInfo,
    OrderCompletionFeedback,
    OrderDetail,
    OrderHistoryEntry,
    OrderLockerInfo,
    OrderSearchQuery,
    OrderStatistics,
    OrderSummary,
    OrderTimelineEntry,
    OrderTrackingInfo,
    PaginatedOrderResponse,
    PaymentStatus,
    TopUserEntry,
    TopVendorEntry,
    UpdateOrderStatusRequest,
    UserOrdersQuery,
    UserProposalDecision,
    VendorDecisionRequest,
    VendorInfo,
    VendorOrdersQuery,
    VendorProposalRequest,
    AdminOrderStatistics,
    AdminStatisticsQuery,
} from '@/core/entities/orders';
import { ApiResponse } from '@/core/interfaces/repositories';

interface AdminStatisticsResponse extends ApiResponse<AdminOrderStatistics> {}

class OrdersService {
    private readonly baseUrl = '/api/v1/orders';
    private readonly checkoutUrl = '/api/v1/checkout';
    private readonly adminUrl = '/api/v1/admin/orders';

    private buildQuery(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                return;
            }
            searchParams.append(key, String(value));
        });
        return searchParams.toString();
    }

    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            Accept: 'application/json',
            ...(options.headers || {}),
        };

        const hasBody = options.body !== undefined && options.body !== null;
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

        if (hasBody && !isFormData) {
            headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
            if (typeof options.body !== 'string') {
                options.body = JSON.stringify(options.body);
            }
        }

        const response = await fetch(url, {
            ...options,
            headers,
            cache: 'no-store',
        });

        if (!response.ok) {
            let message = `Request failed with status ${response.status}`;
            try {
                const error = await response.json();
                message = error?.message || JSON.stringify(error);
            } catch {
                try {
                    message = await response.text();
                } catch {
                    // ignore
                }
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return (await response.json()) as T;
        }

        return (await response.text()) as unknown as T;
    }

    // ------------------------------------------------------
    // Checkout Phase
    // ------------------------------------------------------
    validateCheckout(userId: number, payload?: CheckoutValidationPayload): Promise<ApiResponse<CheckoutValidationResult>> {
        const query = this.buildQuery({ userId });
        return this.request(`${this.checkoutUrl}/validate?${query}`, {
            method: 'POST',
            body: payload as any,
        });
    }

    checkLockerAvailability(params: LockerAvailabilityParams): Promise<ApiResponse<LockerAvailabilityResult>> {
        const query = this.buildQuery(params);
        return this.request(`${this.checkoutUrl}/locker-availability?${query}`, {
            method: 'GET',
        });
    }

    getCheckoutSummary(params: CheckoutSummaryParams): Promise<ApiResponse<CheckoutSummary>> {
        const query = this.buildQuery(params);
        return this.request(`${this.checkoutUrl}/summary?${query}`, {
            method: 'GET',
        });
    }

    createOrder(payload: CreateOrderRequest): Promise<ApiResponse<OrderDetail>> {
        return this.request(`${this.checkoutUrl}/create-order`, {
            method: 'POST',
            body: payload as any,
        });
    }

    // ------------------------------------------------------
    // Vendor Workflow
    // ------------------------------------------------------
    vendorAcceptOrder(payload: VendorDecisionRequest): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/vendor/accept`, {
            method: 'POST',
            body: payload as any,
        });
    }

    vendorRejectOrder(payload: VendorDecisionRequest): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/vendor/reject`, {
            method: 'POST',
            body: payload as any,
        });
    }

    vendorProposeChanges(payload: VendorProposalRequest): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/vendor/propose-changes`, {
            method: 'POST',
            body: payload as any,
        });
    }

    // ------------------------------------------------------
    // User Proposal Responses
    // ------------------------------------------------------
    userAcceptProposal(payload: UserProposalDecision): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/user/accept-proposal`, {
            method: 'POST',
            body: payload as any,
        });
    }

    userRejectProposal(payload: UserProposalDecision): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/user/reject-proposal`, {
            method: 'POST',
            body: payload as any,
        });
    }

    // ------------------------------------------------------
    // Preparation & Delivery
    // ------------------------------------------------------
    vendorStartPreparation(orderId: string, vendorId: string): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/${orderId}/vendor/start-preparation?vendorId=${vendorId}`, {
            method: 'POST',
        });
    }

    vendorMarkReady(orderId: string, vendorId: string): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/${orderId}/vendor/mark-ready?vendorId=${vendorId}`, {
            method: 'POST',
        });
    }

    vendorPrepareLegacy(orderId: string, vendorId: string): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/vendor/prepare?vendorId=${vendorId}`, {
            method: 'POST',
        });
    }

    vendorReadyLegacy(orderId: string, vendorId: string): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/vendor/ready?vendorId=${vendorId}`, {
            method: 'POST',
        });
    }

    confirmPickup(orderId: string, deliveryPersonId: number): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/delivery/pickup?deliveryPersonId=${deliveryPersonId}`, {
            method: 'POST',
        });
    }

    startDelivery(orderId: string, deliveryPersonId: number): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/${orderId}/delivery/start?deliveryPersonId=${deliveryPersonId}`, {
            method: 'POST',
        });
    }

    openLocker(orderId: string, deliveryPersonId: number, accessCode: string): Promise<ApiResponse<OrderLockerInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/delivery/locker/open?deliveryPersonId=${deliveryPersonId}&accessCode=${accessCode}`, {
            method: 'POST',
        });
    }

    customerLockerAccess(orderId: string, userId: number, payload: LockerAccessRequest): Promise<ApiResponse<OrderLockerInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/customer/locker/access?userId=${userId}`, {
            method: 'POST',
            body: payload as any,
        });
    }

    completeOrder(orderId: string, userId: number, payload: OrderCompletionFeedback): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/complete?userId=${userId}`, {
            method: 'POST',
            body: payload as any,
        });
    }

    userConfirmReceipt(orderId: string, userId: number): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/workflow/${orderId}/user/confirm-receipt?userId=${userId}`, {
            method: 'POST',
        });
    }

    // ------------------------------------------------------
    // Tracking & History
    // ------------------------------------------------------
    getTracking(orderId: string): Promise<ApiResponse<OrderTrackingInfo>> {
        return this.request(`${this.baseUrl}/tracking/${orderId}`, {
            method: 'GET',
        });
    }

    getLiveLocation(orderId: string): Promise<ApiResponse<LiveLocationInfo>> {
        return this.request(`${this.baseUrl}/tracking/${orderId}/live-location`, {
            method: 'GET',
        });
    }

    subscribeToTracking(orderId: string, userId: number): Promise<ApiResponse<{ subscriptionToken: string; websocketUrl: string; topic: string; expiresAt: string }>> {
        return this.request(`${this.baseUrl}/tracking/${orderId}/subscribe?userId=${userId}`, {
            method: 'POST',
        });
    }

    getOrderHistory(orderId: string, userId?: number): Promise<ApiResponse<OrderHistoryEntry[]>> {
        const query = this.buildQuery(userId ? { userId } : {});
        const suffix = query ? `?${query}` : '';
        return this.request(`${this.baseUrl}/${orderId}/history${suffix}`, {
            method: 'GET',
        });
    }

    // ------------------------------------------------------
    // Order Management
    // ------------------------------------------------------
    getOrderById(orderId: string): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}`, {
            method: 'GET',
        });
    }

    getOrderDetails(orderId: string): Promise<ApiResponse<OrderDetail>> {
        return this.request(`${this.baseUrl}/${orderId}/details`, {
            method: 'GET',
        });
    }

    getUserOrders(userId: number, query: UserOrdersQuery = {}): Promise<ApiResponse<PaginatedOrderResponse>> {
        const search = this.buildQuery({ ...query });
        const suffix = search ? `?${search}` : '';
        return this.request(`${this.baseUrl}/user/${userId}${suffix}`, {
            method: 'GET',
        });
    }

    getUserActiveOrders(userId: number): Promise<ApiResponse<OrderSummary[]>> {
        return this.request(`${this.baseUrl}/user/${userId}/active`, {
            method: 'GET',
        });
    }

    getVendorOrders(vendorId: string, query: VendorOrdersQuery = {}): Promise<ApiResponse<PaginatedOrderResponse>> {
        const search = this.buildQuery({ ...query });
        const suffix = search ? `?${search}` : '';
        return this.request(`${this.baseUrl}/vendor/${vendorId}${suffix}`, {
            method: 'GET',
        });
    }

    updateOrderStatus(orderId: string, payload: UpdateOrderStatusRequest): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/status`, {
            method: 'PUT',
            body: payload as any,
        });
    }

    cancelOrder(orderId: string, payload: CancelOrderRequest): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/cancel`, {
            method: 'POST',
            body: payload as any,
        });
    }

    assignDelivery(orderId: string, payload: AssignDeliveryRequest): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/assign-delivery`, {
            method: 'POST',
            body: payload as any,
        });
    }

    markDelivered(orderId: string, deliveryPersonId: number): Promise<ApiResponse<OrderBasicInfo>> {
        return this.request(`${this.baseUrl}/${orderId}/delivered?deliveryPersonId=${deliveryPersonId}`, {
            method: 'POST',
        });
    }

    getOrderStats(): Promise<ApiResponse<OrderStatistics>> {
        return this.request(`${this.baseUrl}/stats`, {
            method: 'GET',
        });
    }

    searchOrders(query: OrderSearchQuery): Promise<ApiResponse<{ orders: OrderSummary[]; totalElements: number; totalPages: number; currentPage: number; pageSize: number; appliedFilters?: Record<string, unknown> }>> {
        const search = this.buildQuery(query);
        return this.request(`${this.baseUrl}/search?${search}`, {
            method: 'GET',
        });
    }

    searchOrdersByKeyword(query: KeywordSearchQuery): Promise<ApiResponse<{ orders: OrderSummary[]; totalElements: number; totalPages: number }>> {
        const search = this.buildQuery(query);
        return this.request(`${this.baseUrl}/search/keyword?${search}`, {
            method: 'GET',
        });
    }

    getOrdersByDateRange(query: DateRangeQuery): Promise<ApiResponse<{ orders: OrderSummary[]; totalElements: number; totalPages: number; dateRange?: { from: string; to: string } }>> {
        const search = this.buildQuery(query);
        return this.request(`${this.baseUrl}/search/date-range?${search}`, {
            method: 'GET',
        });
    }

    getOrdersByAmountRange(query: AmountRangeQuery): Promise<ApiResponse<{ orders: OrderSummary[]; totalElements: number; totalPages: number; amountRange?: { min: number; max: number } }>> {
        const search = this.buildQuery(query);
        return this.request(`${this.baseUrl}/search/amount-range?${search}`, {
            method: 'GET',
        });
    }

    // ------------------------------------------------------
    // Admin Operations
    // ------------------------------------------------------
    forceCancelOrder(orderId: string, payload: ForceCancelRequest): Promise<ApiResponse<OrderBasicInfo>> {
        const query = this.buildQuery(payload);
        return this.request(`${this.adminUrl}/${orderId}/force-cancel?${query}`, {
            method: 'POST',
        });
    }

    manualStatusUpdate(orderId: string, payload: ManualStatusUpdateRequest): Promise<ApiResponse<OrderBasicInfo>> {
        const query = this.buildQuery(payload);
        return this.request(`${this.adminUrl}/${orderId}/status?${query}`, {
            method: 'PUT',
        });
    }

    getAdminStatistics(query: AdminStatisticsQuery = {}): Promise<AdminStatisticsResponse> {
        const search = this.buildQuery(query);
        const suffix = search ? `?${search}` : '';
        return this.request(`${this.adminUrl}/statistics${suffix}`, {
            method: 'GET',
        });
    }

    getTopVendors(limit: number = 10): Promise<ApiResponse<TopVendorEntry[]>> {
        return this.request(`${this.adminUrl}/top-vendors?limit=${limit}`, {
            method: 'GET',
        });
    }

    getTopUsers(limit: number = 10): Promise<ApiResponse<TopUserEntry[]>> {
        return this.request(`${this.adminUrl}/top-users?limit=${limit}`, {
            method: 'GET',
        });
    }

    getOrdersRequiringAttention(): Promise<ApiResponse<AttentionOrderEntry[]>> {
        return this.request(`${this.adminUrl}/requires-attention`, {
            method: 'GET',
        });
    }
}

export const ordersService = new OrdersService();

export type { OrderBasicInfo, OrderTimelineEntry, OrderStatistics, PaymentStatus };
