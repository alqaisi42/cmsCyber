// src/core/entities/orders.ts
// Comprehensive order domain models for order flow management

export type OrderStatus =
    | 'REQUESTED'
    | 'VENDOR_ACCEPTED'
    | 'VENDOR_REJECTED'
    | 'NEGOTIATING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY_FOR_DELIVERY'
    | 'ASSIGNED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';

export type PaymentStatus =
    | 'PENDING'
    | 'PAID'
    | 'REFUNDED'
    | 'FAILED';

export type OrderActor =
    | 'USER'
    | 'VENDOR'
    | 'DELIVERY_PERSON'
    | 'SYSTEM'
    | 'ADMIN';

export interface OrderItemSummary {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
    changeReason?: string;
}

export interface OrderCartSummary {
    items: OrderItemSummary[];
    itemCount: number;
    subtotal: number;
}

export interface CheckoutValidationResult {
    isValid: boolean;
    issues: string[];
    cartSummary: OrderCartSummary | null;
}

export interface OrderLockerAvailabilityResult {
    isAvailable: boolean;
    lockerId: string;
    locationId: string;
    deliveryTime: string;
    lockerSize: string;
    reason?: string | null;
    alternativeSlots?: string[];
}

export interface CheckoutSummary {
    items: OrderItemSummary[];
    itemCount: number;
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    deliveryFee: number;
    discountAmount: number;
    promoCode?: string | null;
    totalAmount: number;
}

export interface OrderBasicInfo {
    id: string;
    userId: number;
    vendorId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    subtotal?: number;
    taxAmount?: number;
    deliveryFee?: number;
    discountAmount?: number;
    deliveryTime?: string;
    deliveryAddress?: string;
    deliveryNotes?: string | null;
    lockerId?: string;
    locationId?: string;
    deliveryPersonId?: number | null;
    vendorName?: string;
    userName?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderSummary extends OrderBasicInfo {
    estimatedDelivery?: string | null;
}

export interface OrderTimelineEntry {
    status: OrderStatus;
    timestamp: string;
    actor: OrderActor;
    actorId?: string | number | null;
    description?: string | null;
    notes?: string | null;
}

export interface OrderLockerInfo {
    lockerId: string;
    lockerNumber?: string;
    locationName?: string;
    locationAddress?: string;
    size?: string;
}

export interface VendorInfo {
    id: string;
    name: string;
    rating?: number;
}

export interface DeliveryPersonInfo {
    id: number | string;
    name?: string;
    phone?: string;
    rating?: number;
}

export interface OrderDetail {
    order: OrderBasicInfo;
    items: OrderItemSummary[];
    statusHistory?: OrderTimelineEntry[];
    locker?: OrderLockerInfo | null;
    vendor?: VendorInfo | null;
    deliveryPerson?: DeliveryPersonInfo | null;
}

export interface OrderTrackingInfo {
    orderId: string;
    currentStatus: OrderStatus;
    timeline: OrderTimelineEntry[];
    deliveryPerson?: DeliveryPersonInfo | null;
    locker?: OrderLockerInfo | null;
    estimatedDelivery?: string | null;
    actualDelivery?: string | null;
}

export interface LiveLocationInfo {
    orderId: string;
    isAvailable: boolean;
    currentLocation?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        timestamp?: string;
    };
    destination?: {
        latitude: number;
        longitude: number;
    };
    estimatedArrival?: string | null;
    remainingDistance?: number | null;
    currentSpeed?: number | null;
    deliveryPerson?: Partial<DeliveryPersonInfo> | null;
    message?: string | null;
}

export interface OrderHistoryEntry {
    status: OrderStatus;
    timestamp: string;
    actor: OrderActor;
    actorId?: string | number;
    description?: string | null;
    notes?: string | null;
}

export interface OrderStatistics {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus | string, number>;
    period?: string;
}

export interface RevenueByDayEntry {
    date: string;
    revenue: number;
    orderCount: number;
}

export interface CategoryPerformanceEntry {
    category: string;
    orderCount: number;
    revenue: number;
}

export interface AdminOrderStatistics extends OrderStatistics {
    vendorCount: number;
    customerCount: number;
    deliveryPersonCount: number;
    revenueByDay?: RevenueByDayEntry[];
    topCategories?: CategoryPerformanceEntry[];
}

export interface TopVendorEntry {
    vendorId: string;
    vendorName: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    rating?: number;
    joinedDate?: string;
}

export interface TopUserEntry {
    userId: number;
    userName: string;
    email?: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    joinedDate?: string;
    lastOrderDate?: string;
}

export interface AttentionOrderEntry {
    id: string;
    userId: number;
    vendorId: string;
    status: OrderStatus;
    issueType: string;
    issueDescription: string;
    createdAt: string;
    lastUpdated?: string;
    estimatedDelivery?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
}

export interface PaginatedOrderResponse {
    orders: OrderSummary[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export interface OrderSearchFilters {
    userId?: number;
    vendorId?: string;
    status?: OrderStatus | '';
    createdFrom?: string;
    createdTo?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    page?: number;
    size?: number;
    keyword?: string;
}

export interface CreateOrderRequest {
    userId: number;
    vendorId: string;
    locationId: string;
    lockerId: string;
    deliveryTime: string;
    deliveryAddress: string;
    deliveryNotes?: string;
    paymentMethod: string;
    promoCode?: string;
}

export interface VendorDecisionRequest {
    orderId: string;
    vendorId: string;
    notes?: string;
    reason?: string;
}

export interface VendorProposalRequest {
    orderId: string;
    vendorId: string;
    proposalNotes?: string;
    proposedChanges: {
        items: OrderItemSummary[];
        newSubtotal?: number;
        newTaxAmount?: number;
        newTotalAmount?: number;
    };
}

export interface UserProposalDecision {
    orderId: string;
    userId: number;
    acceptanceNotes?: string;
    rejectionReason?: string;
}

export interface AssignDeliveryRequest {
    deliveryPersonId: number;
    assignedBy: string;
    notes?: string;
}

export interface UpdateOrderStatusRequest {
    status: OrderStatus;
    reason?: string;
    updatedBy: OrderActor | string;
    userId?: number;
}

export interface CancelOrderRequest {
    userId: number;
    reason: string;
    cancelledBy: OrderActor | string;
}

export interface LockerAccessRequest {
    accessCode: string;
    retrievalConfirmed?: boolean;
}

export interface OrderCompletionFeedback {
    vendorRating: number;
    deliveryRating: number;
    comment?: string;
    issues?: string[];
}

export interface ManualStatusUpdateRequest {
    newStatus: OrderStatus;
    adminId: number;
    reason?: string;
}

export interface ForceCancelRequest {
    adminId: number;
    reason: string;
}

export interface CheckoutValidationPayload {
    items?: Array<{ productId: string; quantity: number }>;
}

export interface LockerAvailabilityParams {
    userId: number;
    locationId: string;
    lockerId: string;
    deliveryTime: string;
    requiredSize: string;
}

export interface CheckoutSummaryParams {
    userId: number;
    promoCode?: string;
}

export interface UserOrdersQuery {
    status?: OrderStatus;
    page?: number;
    size?: number;
}

export interface VendorOrdersQuery {
    status?: OrderStatus;
    page?: number;
    size?: number;
}

export interface DateRangeQuery {
    startDate: string;
    endDate: string;
    page?: number;
    size?: number;
}

export interface AmountRangeQuery {
    minAmount: number;
    maxAmount: number;
    page?: number;
    size?: number;
}

export interface KeywordSearchQuery {
    keyword: string;
    page?: number;
    size?: number;
}

export interface AdminStatisticsQuery {
    period?: string;
}

export interface OrderSearchQuery extends OrderSearchFilters {}

