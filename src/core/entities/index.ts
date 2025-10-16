// src/core/entities/index.ts
// Updated Core Entity Types matching API specification

export interface BaseEntity {
    id: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
}

// ============================================================================
// PROVIDER ENTITIES
// ============================================================================

export interface Provider {
    id: string;
    name: string;
    logoUrl: string;
    rating: number;
    isActive: boolean;
    totalProducts: number;
    productsInStock: number;
    averagePrice: number;
    createdAt: string;
}

export interface ProviderCreateDto {
    name: string;
    logoUrl: string;
    isActive?: boolean;
}

// ============================================================================
// CATEGORY ENTITIES
// ============================================================================

export interface Category {
    id: string;
    name: string;
    code: string;
    description: string;
    iconUrl: string;
    parentId: string | null;
    parentName?: string;
    displayOrder: number;
    isActive: boolean;
    productCount: number;
    subcategories?: Category[];
    createdAt: string;
    updatedAt: string;
}

export interface CategoryBreadcrumb {
    id: string;
    name: string;
    code: string;
}

// ============================================================================
// PRODUCT ENTITIES
// ============================================================================

export type ProductSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
export type ProductColor = 'black' | 'white' | 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'orange' | 'brown' | 'gray' | 'navy' | 'beige';
export type ImageType = 'regular' | '360' | 'thumbnail';

export interface Product {
    id: string;
    name: string;
    basePrice: number;
    priceRange: string;
    category: Category;
    categoryBreadcrumb: CategoryBreadcrumb[];
    provider: Provider;
    primaryImageUrl: string;
    availableSizes: ProductSize[];
    availableColors: ProductColor[];
    is360Enabled: boolean;
    totalStock: number;
    brandName: string;
    rating: number;
    reviewCount: number;
    isOnSale: boolean;
    discountPercentage: number;
    originalPrice: number;
    tags: string[];
    createdAt: string;
}

export interface ProductDetail extends Product {
    description?: string;
    variants?: ProductVariant[];
    images?: ProductImage[];
}

export interface ProductCreateDto {
    name: string;
    description: string;
    basePrice: number;
    categoryId: string;
    providerId: string;
    brandName: string;
    is360Enabled?: boolean;
    variants: ProductVariantCreateDto[];
    images: ProductImageCreateDto[];
}

// ============================================================================
// PRODUCT VARIANT ENTITIES
// ============================================================================

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    size: ProductSize;
    color: ProductColor;
    basePrice: number;
    priceAdjustment: number;
    price: number;
    stockQuantity: number;
    lowStockThreshold: number;
    isAvailable: boolean;
    barcode: string;
    weight: number;
    inStockNo: string;
    isLowStock: boolean;
    createdAt: string;
    images: ProductImage[];
}

export interface ProductVariantCreateDto {
    size: ProductSize;
    color: ProductColor;
    sku: string;
    basePrice: number;
    priceAdjustment: number;
    stockQuantity: number;
    lowStockThreshold: number;
    isAvailable: boolean;
    barcode: string;
    weight: number;
    inStockNo: string;
}

// ============================================================================
// PRODUCT IMAGE ENTITIES
// ============================================================================

export interface ProductImage {
    id: string;
    productId: string;
    imageUrl: string;
    imageType: ImageType;
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor: ProductColor;
    variantId: string;
    altText: string;
    dimensions: string;
    fileSize: number;
    createdAt: string;
}

export interface ProductImageCreateDto {
    imageUrl: string;
    imageType: ImageType;
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor: ProductColor;
    variantId?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors?: string[];
    timestamp: string;
}

export interface PaginatedData<T> {
    totalElements: number;
    totalPages: number;
    size: number;
    content: T[];
    number: number;
    sort: {
        empty: boolean;
        unsorted: boolean;
        sorted: boolean;
    };
    last: boolean;
    numberOfElements: number;
    pageable: {
        offset: number;
        sort: {
            empty: boolean;
            unsorted: boolean;
            sorted: boolean;
        };
        unpaged: boolean;
        pageSize: number;
        pageNumber: number;
        paged: boolean;
    };
    first: boolean;
    empty: boolean;
}

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

export interface ProductSearchParams {
    query?: string;
    categoryId?: string;
    providerIds?: string[];
    sizes?: ProductSize[];
    colors?: ProductColor[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'newest' | 'price_low_high' | 'price_high_low' | 'popularity' | 'rating';
    page?: number;
    size?: number;
}

// Existing entities for backward compatibility
export interface User extends BaseEntity {
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    USER = 'USER'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}

// ============================================================================
// BACKWARD COMPATIBILITY - Old Entity Types
// ============================================================================

// User entities (existing)
export interface User extends BaseEntity {
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
}

// Old Provider status enum (for backward compatibility with mock data)
export enum ProviderStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING'
}

// Old Product status enum (for backward compatibility with mock data)
export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK'
}

// Old Locker entity (for backward compatibility with mock data)
export interface Locker extends BaseEntity {
    lockerId: string;
    location: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    capacity: number;
    availableSlots: number;
    status: LockerStatus;
    temperature?: number;
}

export enum LockerStatus {
    OPERATIONAL = 'OPERATIONAL',
    MAINTENANCE = 'MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

// Old Dashboard stats (for backward compatibility with mock data)
export interface DashboardStats {
    totalUsers: number;
    totalProviders: number;
    totalProducts: number;
    totalLockers: number;
    activeOrders: number;
    revenue: number;
    trends: {
        users: number;
        providers: number;
        products: number;
        revenue: number;
    };
}