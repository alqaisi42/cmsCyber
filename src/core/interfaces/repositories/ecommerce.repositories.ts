// src/core/interfaces/repositories/ecommerce.repositories.ts
// NEW E-commerce repository interfaces

import {
    ShopProvider,
    ShopProduct,
    ProductVariant,
    Category,
    CreateProductRequest,
    CreateVariantRequest,
    ProductSearchParams,
    ProviderStatsResponse
} from '../../entities/ecommerce';
import {PaginatedResponse, PaginationParams} from "../repositories";

// Import from base repository (single source of truth)

// ============================================================================
// PROVIDER REPOSITORY
// ============================================================================

export interface IShopProviderRepository {
    // Basic CRUD
    getAll(params: PaginationParams): Promise<PaginatedResponse<ProviderStatsResponse>>;
    getById(id: string): Promise<ShopProvider>;
    create(provider: Omit<ShopProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShopProvider>;
    update(id: string, provider: Partial<ShopProvider>): Promise<ShopProvider>;
    delete(id: string): Promise<void>;

    // Provider-specific operations
    toggleStatus(id: string, isActive: boolean): Promise<ShopProvider>;
    getProviderStats(id: string): Promise<ProviderStatsResponse>;
    updateRating(id: string, rating: number): Promise<ShopProvider>;
}

// ============================================================================
// PRODUCT REPOSITORY
// ============================================================================

export interface IShopProductRepository {
    // Basic CRUD
    getAll(params: PaginationParams): Promise<PaginatedResponse<ShopProduct>>;
    getById(id: string): Promise<ShopProduct>;
    create(request: CreateProductRequest): Promise<ShopProduct>;
    update(id: string, product: Partial<ShopProduct>): Promise<ShopProduct>;
    delete(id: string): Promise<void>;

    // Provider operations
    getByProviderId(
        providerId: string,
        page: number,
        size: number
    ): Promise<PaginatedResponse<ShopProduct>>;

    // Search operations
    search(params: ProductSearchParams): Promise<PaginatedResponse<ShopProduct>>;

    // Category operations
    getByCategoryId(categoryId: string): Promise<ShopProduct[]>;

    // Stock operations
    updateStock(productId: string, quantity: number): Promise<ShopProduct>;
    getLowStockProducts(threshold: number): Promise<ShopProduct[]>;
}

// ============================================================================
// PRODUCT VARIANT REPOSITORY
// ============================================================================

export interface IProductVariantRepository {
    // Basic CRUD
    getByProductId(productId: string): Promise<ProductVariant[]>;
    getById(id: string): Promise<ProductVariant>;
    create(productId: string, variant: CreateVariantRequest): Promise<ProductVariant>;
    update(id: string, variant: Partial<ProductVariant>): Promise<ProductVariant>;
    delete(id: string): Promise<void>;

    // Stock operations
    updateStock(variantId: string, quantity: number): Promise<ProductVariant>;
    checkAvailability(variantId: string): Promise<boolean>;
    getLowStockVariants(productId: string): Promise<ProductVariant[]>;

    // Search operations
    findBySku(sku: string): Promise<ProductVariant>;
    findByBarcode(barcode: string): Promise<ProductVariant>;
}

// ============================================================================
// CATEGORY REPOSITORY
// ============================================================================

export interface ICategoryRepository {
    // Basic CRUD
    getAll(params: PaginationParams): Promise<PaginatedResponse<Category>>;
    getAllActive(): Promise<Category[]>;
    getById(id: string): Promise<Category>;
    create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
    update(id: string, category: Partial<Category>): Promise<Category>;
    delete(id: string): Promise<void>;

    // Hierarchy operations
    getSubcategories(parentId: string): Promise<Category[]>;
    getRootCategories(): Promise<Category[]>;
    getCategoryTree(): Promise<Category[]>;

    // Product count
    updateProductCount(categoryId: string): Promise<void>;
}