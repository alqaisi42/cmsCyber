// src/core/entities/ecommerce.ts
// NEW E-commerce entities - separate from existing healthcare entities


// ============================================================================
// PROVIDER ENTITIES (Enhanced from basic version)
// ============================================================================

import {BaseEntity} from "./index";

export interface ShopProvider extends BaseEntity {
    name: string;
    logoUrl?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    rating: number;
    isActive: boolean;
    totalProducts: number;
    productsInStock: number;
    averagePrice: number;
    description?: string;
}

// ============================================================================
// CATEGORY ENTITIES (COMPLETELY NEW)
// ============================================================================

export interface Category extends BaseEntity {
    name: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
    iconName?: string;
    sortOrder: number;
    isActive: boolean;
    productCount: number;
}

// ============================================================================
// PRODUCT ENTITIES (Enhanced)
// ============================================================================

export interface ShopProduct extends BaseEntity {
    name: string;
    description: string;
    basePrice: number;
    priceRange?: string; // "$89.99 - $129.99"
    categoryId: string;
    category?: Category;
    providerId: string;
    provider?: ShopProvider;
    brandName?: string;
    primaryImageUrl?: string;
    isOnSale: boolean;
    discountPercentage: number;
    rating: number;
    totalStock: number;
    is360Enabled: boolean;
    status: ProductStatus;
}

export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    DRAFT = 'DRAFT'
}

// ============================================================================
// PRODUCT VARIANT ENTITIES (COMPLETELY NEW)
// ============================================================================

export interface ProductVariant extends BaseEntity {
    productId: string;
    size: string;
    color: string;
    sku: string;
    basePrice: number;
    priceAdjustment: number;
    finalPrice: number; // basePrice + priceAdjustment
    stockQuantity: number;
    lowStockThreshold: number;
    isAvailable: boolean;
    barcode?: string;
    weight?: number;
    inStockNo?: string;
    images: VariantImage[];
}

export interface VariantImage extends BaseEntity {
    variantId: string;
    imageUrl: string;
    imageType: 'regular' | '360' | 'thumbnail';
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor?: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateProductRequest {
    name: string;
    description: string;
    basePrice: number;
    categoryId: string;
    providerId: string;
    brandName?: string;
    is360Enabled: boolean;
    variants: CreateVariantRequest[];
    images: CreateImageRequest[];
}

export interface CreateVariantRequest {
    size: string;
    color: string;
    sku: string;
    basePrice: number;
    priceAdjustment: number;
    stockQuantity: number;
    lowStockThreshold: number;
    isAvailable: boolean;
    barcode?: string;
    weight?: number;
    inStockNo?: string;
}

export interface CreateImageRequest {
    imageUrl: string;
    imageType: 'regular' | '360' | 'thumbnail';
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor?: string;
}

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

export interface ProductSearchParams {
    keyword?: string;
    categoryId?: string;
    providerId?: string;
    minPrice?: number;
    maxPrice?: number;
    isOnSale?: boolean;
    sortBy?: 'newest' | 'priceAsc' | 'priceDesc' | 'rating';
    page: number;
    size: number;
}

export interface ProviderStatsResponse {
    id: string;
    name: string;
    logoUrl?: string;
    rating: number;
    isActive: boolean;
    totalProducts: number;
    productsInStock: number;
    averagePrice: number;
    createdAt: string;
}