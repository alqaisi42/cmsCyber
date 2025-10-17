// =============================================================================
// E-commerce Domain Entities - WITH PROPER NULL HANDLING
// File: src/core/entities/ecommerce.ts
// =============================================================================


// ============================================================================
// SHOP PROVIDER
// ============================================================================

import {BaseEntity} from "./index";

export interface ShopProvider extends BaseEntity {
    name: string;
    description?: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    logoUrl?: string;
    website?: string;
    isActive: boolean;
    rating: number;
}

export interface ProviderStatsResponse {
    id: string;
    name: string;
    logoUrl?: string | null;
    rating: number | null; // ✅ Explicitly nullable
    isActive: boolean;
    totalProducts: number | null; // ✅ Explicitly nullable
    productsInStock: number | null; // ✅ Explicitly nullable
    averagePrice: number | null; // ✅ Explicitly nullable
    createdAt: string;
}

// ============================================================================
// CATEGORY
// ============================================================================

export interface Category extends BaseEntity {
    name: string;
    description?: string;
    slug: string;
    imageUrl?: string;
    isActive: boolean;
    displayOrder: number;
    parentCategoryId?: string;
    subcategories?: Category[];
}

// ============================================================================
// PRODUCT
// ============================================================================

export interface ShopProduct extends BaseEntity {
    name: string;
    description: string;
    basePrice: number | null; // ✅ Explicitly nullable
    categoryId: string;
    categoryName?: string;
    providerId: string;
    providerName?: string;
    brandName?: string;
    sku: string;
    rating: number | null; // ✅ Explicitly nullable
    totalReviews: number;
    totalStock: number | null; // ✅ Explicitly nullable
    isActive: boolean;
    isOnSale: boolean;
    discountPercentage: number | null; // ✅ Explicitly nullable
    is360Enabled: boolean;
    primaryImageUrl?: string;
    priceRange?: string;
}

// ============================================================================
// PRODUCT VARIANT
// ============================================================================

export interface ProductVariant extends BaseEntity {
    productId: string;
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
    images?: VariantImage[] | VariantImageGroup | null;
}

export interface VariantImage {
    id?: string;
    productId?: string;
    variantId?: string;
    imageUrl: string;
    imageType: 'regular' | 'rotation360' | '360' | 'thumbnail';
    sequenceOrder?: number;
    isPrimary?: boolean;
    associatedColor?: string | null;
    rotationFrameNumber?: number | null;
    createdAt?: string | null;
}

export interface VariantImageGroup {
    variantId: string;
    color?: string | null;
    size?: string | null;
    primaryImage: VariantImage | null;
    galleryImages?: VariantImage[];
    rotation360Images?: VariantImage[];
    totalImages?: number;
    has360View?: boolean;
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