// =============================================================================
// File: src/infrastructure/services/shop-admin.service.ts
// FINAL FIX - Type safe with correct PaginatedResponse interface
// =============================================================================

import {
    ShopProvider,
    ShopProduct,
    ShopProductDetail,
    ProductVariant,
    Category,
    CreateProductRequest,
    CreateVariantRequest,
    ProductSearchParams,
    ProviderSummary,
    ProviderStatistics,
} from '../../core/entities/ecommerce';
import { ApiResponse, PaginatedResponse } from '../../core/interfaces/repositories';
import { ProviderSearchRequest, ProviderSearchResult } from '../../core/types/provider.types';

// ============================================================================
// SPRING BOOT RESPONSE TYPES
// ============================================================================

/**
 * Spring Boot pagination response structure from backend
 */
interface SpringBootPageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

// ============================================================================
// RESPONSE TRANSFORMATION
// ============================================================================

/**
 * Transform Spring Boot page response to our PaginatedResponse format
 *
 * Our PaginatedResponse interface (from src/core/interfaces/repositories.ts):
 * {
 *   data: T[];
 *   total: number;
 *   page: number;
 *   limit: number;
 *   totalPages: number;
 * }
 */
function transformToPaginatedResponse<T>(springResponse: SpringBootPageResponse<T>): PaginatedResponse<T> {
    return {
        data: springResponse.content,           // ✅ data = content
        total: springResponse.totalElements,    // ✅ total = totalElements
        page: springResponse.number,            // ✅ page = number
        limit: springResponse.size,             // ✅ limit = size
        totalPages: springResponse.totalPages,  // ✅ totalPages = totalPages
    };
}

// ============================================================================
// PROVIDER SERVICE
// ============================================================================

class ShopProviderService {
    private readonly baseUrl = '/api/v1/providers';

    /**
     * Get all providers (active by default)
     */
    async getProviders(): Promise<ApiResponse<ProviderSummary[]>> {
        const response = await fetch(this.baseUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse: ApiResponse<ProviderListItem[]> = await response.json();
        return {
            success: apiResponse.success,
            data: apiResponse.data.map(mapProviderListItemToSummary),
            message: apiResponse.message,
            errors: apiResponse.errors,
            timestamp: apiResponse.timestamp,
        };
    }

    /**
     * Search providers with advanced filters and pagination
     */
    async searchProviders(params: ProviderSearchRequest): Promise<PaginatedResponse<ProviderSummary>> {
        const response = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: params.query ?? '',
                isActive: params.isActive,
                minRating: params.minRating,
                maxCommission: params.maxCommission,
                hasProducts: params.hasProducts,
                sortBy: params.sortBy ?? 'NAME',
                sortDirection: params.sortDirection ?? 'ASC',
                page: params.page ?? 0,
                size: params.size ?? 20,
            }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse: ApiResponse<SpringBootPageResponse<ProviderSearchResult>> = await response.json();
        const page = apiResponse.data;

        return {
            data: page.content.map(mapProviderSearchResultToSummary),
            total: page.totalElements,
            page: page.number,
            limit: page.size,
            totalPages: page.totalPages,
        };
    }

    /**
     * Get provider by ID
     */
    async getProviderById(id: string): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            cache: 'no-store',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Get provider statistics for a specific period
     */
    async getProviderStatistics(
        providerId: string,
        periodStart?: string,
        periodEnd?: string,
    ): Promise<ApiResponse<ProviderStatistics>> {
        const query = new URLSearchParams();
        if (periodStart) query.append('periodStart', periodStart);
        if (periodEnd) query.append('periodEnd', periodEnd);

        const url = query.toString()
            ? `${this.baseUrl}/${providerId}/statistics?${query.toString()}`
            : `${this.baseUrl}/${providerId}/statistics`;

        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Get products for a specific provider with pagination
     */
    async getProviderProducts(
        providerId: string,
        page: number = 0,
        size: number = 20,
    ): Promise<PaginatedResponse<ShopProduct>> {
        const response = await fetch(
            `${this.baseUrl}/${providerId}/products?page=${page}&size=${size}`,
            { cache: 'no-store' },
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse: ApiResponse<SpringBootPageResponse<ShopProduct>> = await response.json();
        return transformToPaginatedResponse(apiResponse.data);
    }

    /**
     * Create a new provider
     */
    async createProvider(
        provider: Omit<ShopProvider, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Update provider details
     */
    async updateProvider(id: string, provider: Partial<ShopProvider>): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Toggle provider active status
     */
    async toggleProviderStatus(id: string): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}/toggle-status`, {
            method: 'PATCH',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Update provider rating
     */
    async updateProviderRating(id: string, rating: number): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}/rating?rating=${rating}`, {
            method: 'PATCH',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Delete provider (soft or hard)
     */
    async deleteProvider(id: string, hardDelete: boolean = false): Promise<ApiResponse<unknown>> {
        const response = await fetch(`${this.baseUrl}/${id}?hardDelete=${hardDelete}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }
}

interface ProviderListItem {
    id: string;
    name: string;
    logoUrl?: string | null;
    rating?: number | null;
    isActive: boolean;
}

function mapProviderSearchResultToSummary(result: ProviderSearchResult): ProviderSummary {
    return {
        id: result.id,
        name: result.name,
        logoUrl: result.logoUrl,
        rating: result.rating,
        isActive: result.isActive,
        productsCount: result.productsCount,
        commissionPercentage: result.commissionPercentage,
        averageProductPrice: null,
        totalRevenue: null,
        createdAt: null,
        updatedAt: null,
    };
}

function mapProviderListItemToSummary(result: ProviderListItem): ProviderSummary {
    return {
        id: result.id,
        name: result.name,
        logoUrl: result.logoUrl ?? null,
        rating: result.rating ?? null,
        isActive: result.isActive,
        productsCount: null,
        commissionPercentage: null,
        averageProductPrice: null,
        totalRevenue: null,
        activeProductsCount: null,
        categoriesCount: null,
        createdAt: null,
        updatedAt: null,
    };
}

// ============================================================================
// PRODUCT SERVICE
// ============================================================================

class ShopProductService {
    private readonly baseUrl = '/api/v1/products';

    /**
     * Get all products with pagination
     * ✅ This was MISSING and causing the error!
     */
    async getProducts(page: number = 0, size: number = 20): Promise<PaginatedResponse<ShopProduct>> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse: ApiResponse<SpringBootPageResponse<ShopProduct>> = await response.json();
        return transformToPaginatedResponse(apiResponse.data);
    }

    /**
     * Create a new product
     */
    async createProduct(request: CreateProductRequest): Promise<ApiResponse<{ id: string }>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Get product by ID
     */
    async getProductById(id: string): Promise<ApiResponse<ShopProductDetail>> {
        const response = await fetch(`${this.baseUrl}/${id}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Explicitly cast to ApiResponse<ShopProductDetail>
        return (await response.json()) as ApiResponse<ShopProductDetail>;
    }

    /**
     * Update product
     */
    async updateProduct(id: string, product: Partial<ShopProduct>): Promise<ApiResponse<ShopProduct>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Delete product
     */
    async deleteProduct(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Search products with filters and pagination
     */
    async searchProducts(params: ProductSearchParams): Promise<PaginatedResponse<ShopProduct>> {
        const queryParams = new URLSearchParams();
        if (params.keyword) queryParams.append('keyword', params.keyword);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.providerId) queryParams.append('providerId', params.providerId);
        if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
        if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
        if (params.isOnSale !== undefined) queryParams.append('isOnSale', params.isOnSale.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        queryParams.append('page', params.page.toString());
        queryParams.append('size', params.size.toString());

        const response = await fetch(`${this.baseUrl}/search?${queryParams.toString()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse: ApiResponse<SpringBootPageResponse<ShopProduct>> = await response.json();
        return transformToPaginatedResponse(apiResponse.data);
    }
}

// ============================================================================
// VARIANT SERVICE
// ============================================================================

class ProductVariantService {
    /**
     * Get all variants for a product
     */
    async getProductVariants(productId: string): Promise<ApiResponse<ProductVariant[]>> {
        const response = await fetch(`/api/v1/products/${productId}/variants`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Create a new variant
     */
    async createVariant(productId: string, request: CreateVariantRequest): Promise<ApiResponse<ProductVariant>> {
        const response = await fetch(`/api/v1/products/${productId}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Update a variant
     */
    async updateVariant(variantId: string, variant: Partial<ProductVariant>): Promise<ApiResponse<ProductVariant>> {
        const response = await fetch(`/api/v1/variants/${variantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(variant)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Delete a variant
     */
    async deleteVariant(variantId: string): Promise<ApiResponse<void>> {
        const response = await fetch(`/api/v1/variants/${variantId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }
}

// ============================================================================
// CATEGORY SERVICE
// ============================================================================

class CategoryService {
    private readonly baseUrl = '/api/v1/categories';

    async getCategories(): Promise<ApiResponse<Category[]>> {
        const response = await fetch(this.baseUrl, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async getCategoryById(id: string): Promise<ApiResponse<Category>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'subcategories'>): Promise<ApiResponse<Category>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async updateCategory(id: string, category: Partial<Category>): Promise<ApiResponse<Category>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async deleteCategory(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }
}

// ============================================================================
// EXPORT SERVICE INSTANCES
// ============================================================================

export const shopProviderService = new ShopProviderService();
export const shopProductService = new ShopProductService();
export const productVariantService = new ProductVariantService();
export const categoryService = new CategoryService();