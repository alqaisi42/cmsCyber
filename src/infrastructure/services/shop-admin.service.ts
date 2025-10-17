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
    ProviderStatsResponse
} from '../../core/entities/ecommerce';
import { ApiResponse, PaginatedResponse } from '../../core/interfaces/repositories';

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
     * Get all providers with statistics
     */
    async getProviders(): Promise<ApiResponse<ProviderStatsResponse[]>> {
        const response = await fetch(this.baseUrl, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Get provider by ID
     */
    async getProviderById(id: string): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Get products for a specific provider with pagination
     * Returns transformed PaginatedResponse
     */
    async getProviderProducts(providerId: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<ShopProduct>> {
        const response = await fetch(
            `${this.baseUrl}/${providerId}/products?page=${page}&size=${size}`,
            { cache: 'no-store' }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse: ApiResponse<SpringBootPageResponse<ShopProduct>> = await response.json();
        return transformToPaginatedResponse(apiResponse.data);
    }

    /**
     * Create a new provider
     */
    async createProvider(provider: Omit<ShopProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Update provider
     */
    async updateProvider(id: string, provider: Partial<ShopProvider>): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * Toggle provider active status
     */
    async toggleProviderStatus(id: string, isActive: boolean): Promise<ApiResponse<ShopProvider>> {
        return this.updateProvider(id, { isActive });
    }
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