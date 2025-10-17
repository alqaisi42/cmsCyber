// src/infrastructure/services/shop-admin.service.ts
// COMPLETE FIX - Handles API response structure correctly

import {
    ShopProvider,
    ShopProduct,
    ProductVariant,
    Category,
    CreateProductRequest,
    CreateVariantRequest,
    ProductSearchParams,
    ProviderStatsResponse
} from '../../core/entities/ecommerce';
import { PaginatedResponse } from "../../core/interfaces/repositories";

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface SpringBootPageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalPages: number;
    totalElements: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
    timestamp?: string;
}

// ============================================================================
// TRANSFORM FUNCTION
// ============================================================================

function transformToPaginatedResponse<T>(springResponse: SpringBootPageResponse<T>): PaginatedResponse<T> {
    return {
        data: springResponse.content || [],
        total: springResponse.totalElements || 0,
        page: springResponse.pageable?.pageNumber || 0,
        limit: springResponse.pageable?.pageSize || 20,
        totalPages: springResponse.totalPages || 0
    };
}

// ============================================================================
// PROVIDER SERVICE
// ============================================================================

class ShopProviderService {
    private readonly baseUrl = '/api/v1/providers';

    async getProviders(): Promise<ApiResponse<ProviderStatsResponse[]>> {
        const response = await fetch(this.baseUrl, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async getProviderById(id: string): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * ✅ FIXED: Properly handles nested response structure
     * Backend returns: { success: true, data: { content: [...], totalElements: 156 } }
     * We transform to: { data: [...], total: 156, totalPages: 8, page: 0, limit: 20 }
     */
    async getProviderProducts(
        providerId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PaginatedResponse<ShopProduct>> {
        const url = `${this.baseUrl}/${providerId}/products?page=${page}&size=${size}`;

        console.log('🔵 Fetching providers products:', url);

        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the wrapped response
        const apiResponse: ApiResponse<SpringBootPageResponse<ShopProduct>> = await response.json();

        console.log('🔵 Raw API Response:', apiResponse);
        console.log('🔵 Nested data:', apiResponse.data);

        // Transform the nested Spring Boot response to our format
        const transformed = transformToPaginatedResponse(apiResponse.data);

        console.log('✅ Transformed Response:', transformed);

        return transformed;
    }

    async createProvider(provider: Omit<ShopProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async updateProvider(id: string, provider: Partial<ShopProvider>): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async toggleProviderStatus(id: string, isActive: boolean): Promise<ApiResponse<ShopProvider>> {
        return this.updateProvider(id, { isActive });
    }
}

// ============================================================================
// PRODUCT SERVICE
// ============================================================================

class ShopProductService {
    private readonly baseUrl = '/api/v1/products';

    async createProduct(request: CreateProductRequest): Promise<ApiResponse<{ id: string }>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async getProductById(id: string): Promise<ApiResponse<ShopProduct>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async updateProduct(id: string, product: Partial<ShopProduct>): Promise<ApiResponse<ShopProduct>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async deleteProduct(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    /**
     * ✅ FIXED: Search products with proper transformation
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
// EXPORT SINGLETONS
// ============================================================================

export const shopProviderService = new ShopProviderService();
export const shopProductService = new ShopProductService();
export const productVariantService = new ProductVariantService();
export const categoryService = new CategoryService();