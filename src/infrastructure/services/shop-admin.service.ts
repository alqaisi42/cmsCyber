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
    ProductCategorySummary,
    UpdateProductRequest,
} from '../../core/entities/ecommerce';
import { ApiResponse, PaginatedResponse } from '../../core/interfaces/repositories';
import {
    ProviderSearchRequest,
    ProviderSearchResult,
    CreateProviderCommand,
    CreateProviderRequest,
    ProviderDocumentUploads,
    UpdateProviderRequest,
} from '../../core/types/provider.types';
import {
    ProviderCategoryCreateRequest,
    ProviderCategoryUpdateRequest,
} from '../../core/types/category.types';

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
    private readonly externalBaseUrl =
        process.env.NEXT_PUBLIC_PROVIDER_API_URL ?? 'http://148.230.111.245:32080/api/v1/providers';

    private getAuthHeaders(): Record<string, string> {
        if (typeof window === 'undefined') {
            return {};
        }
        const token = localStorage.getItem('auth_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /**
     * Get all providers (active by default)
     */
    async getProviders(): Promise<ApiResponse<ProviderSummary[]>> {
        const response = await fetch(this.baseUrl, {
            cache: 'no-store',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse = await response.json();
        
        // Handle different response structures
        let providerList: ProviderListItem[] = [];
        
        if (apiResponse && apiResponse.data) {
            if (Array.isArray(apiResponse.data)) {
                // Direct array response: ApiResponse<ProviderListItem[]>
                providerList = apiResponse.data;
            } else if (apiResponse.data.content && Array.isArray(apiResponse.data.content)) {
                // Spring Boot paginated response: ApiResponse<SpringBootPageResponse<ProviderListItem>>
                providerList = apiResponse.data.content;
            }
        } else if (Array.isArray(apiResponse)) {
            // Direct array response (no wrapper)
            providerList = apiResponse;
        }
        
        // If still empty and we have data, log a warning
        if (providerList.length === 0 && apiResponse?.data) {
            console.warn('Unexpected provider response structure:', apiResponse);
        }

        return {
            success: apiResponse?.success ?? true,
            data: providerList.map(mapProviderListItemToSummary),
            message: apiResponse?.message ?? '',
            errors: apiResponse?.errors,
            timestamp: apiResponse?.timestamp ?? new Date().toISOString(),
        };
    }

    /**
     * Search providers with advanced filters and pagination
     */
    async searchProviders(params: ProviderSearchRequest): Promise<PaginatedResponse<ProviderSummary>> {
        const response = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
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
            headers: this.getAuthHeaders(),
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

        const response = await fetch(url, {
            cache: 'no-store',
            headers: this.getAuthHeaders(),
        });
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
            {
                cache: 'no-store',
                headers: this.getAuthHeaders(),
            },
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiResponse: ApiResponse<SpringBootPageResponse<ShopProduct>> = await response.json();
        return transformToPaginatedResponse(apiResponse.data);
    }

    /**
     * Create a new provider
     */
    async createProvider(command: CreateProviderCommand): Promise<ApiResponse<ShopProvider>> {
        const { payload, documents } = command;
        const formData = new FormData();

        const serializedPayload = JSON.stringify(this.buildCreateProviderPayload(payload));
        if (typeof Blob !== 'undefined') {
            formData.append('payload', new Blob([serializedPayload], { type: 'application/json' }), 'payload.json');
        } else {
            formData.append('payload', serializedPayload);
        }

        if (documents) {
            this.appendDocuments(formData, documents);
        }

        const response = await fetch(this.externalBaseUrl || this.baseUrl, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: formData,
        });
        if (!response.ok) {
            const message = await this.extractErrorMessage(response);
            throw new Error(message);
        }
        return response.json();
    }

    private buildCreateProviderPayload(provider: CreateProviderRequest) {
        const {
            address,
            logoUrl,
            contactPhone,
            website,
            description,
            businessRegistrationNumber,
            taxNumber,
            isActive,
            ...rest
        } = provider;

        return {
            ...rest,
            ...(logoUrl ? { logoUrl } : {}),
            ...(contactPhone ? { contactPhone } : {}),
            ...(website ? { website } : {}),
            ...(description ? { description } : {}),
            ...(businessRegistrationNumber ? { businessRegistrationNumber } : {}),
            ...(taxNumber ? { taxNumber } : {}),
            ...(typeof isActive === 'boolean' ? { isActive } : {}),
            address: {
                street: address.street,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
                ...(address.latitude !== undefined && address.latitude !== null
                    ? { latitude: address.latitude }
                    : {}),
                ...(address.longitude !== undefined && address.longitude !== null
                    ? { longitude: address.longitude }
                    : {}),
            },
        };
    }

    private appendDocuments(formData: FormData, documents: ProviderDocumentUploads) {
        Object.entries(documents).forEach(([key, files]) => {
            if (!files || files.length === 0) return;
            files.forEach((file) => {
                formData.append(key, file, file.name);
            });
        });
    }

    private async extractErrorMessage(response: Response): Promise<string> {
        try {
            const contentType = response.headers.get('Content-Type');
            if (contentType?.includes('application/json')) {
                const body = await response.json();
                if (typeof body === 'object' && body !== null) {
                    if ('message' in body && typeof body.message === 'string') {
                        return body.message;
                    }
                    if ('error' in body && typeof body.error === 'string') {
                        return body.error;
                    }
                }
            } else {
                const text = await response.text();
                if (text) {
                    return text;
                }
            }
        } catch (error) {
            console.error('Failed to parse error response', error);
        }

        return `Provider creation failed with status ${response.status}`;
    }

    /**
     * Update provider details
     */
    async updateProvider(id: string, provider: UpdateProviderRequest): Promise<ApiResponse<ShopProvider>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
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
            headers: this.getAuthHeaders(),
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
            headers: this.getAuthHeaders(),
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
            headers: this.getAuthHeaders(),
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
    async updateProduct(id: string, product: UpdateProductRequest): Promise<ApiResponse<ShopProductDetail>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
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

    private readonly providerBaseUrl = '/api/v1/providers';

    private getAuthHeaders(): Record<string, string> {
        if (typeof window === 'undefined') {
            return {};
        }
        const token = localStorage.getItem('auth_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async getCategories(): Promise<ApiResponse<Category[]>> {
        const response = await fetch(this.baseUrl, {
            cache: 'no-store',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async getCategoryById(id: string): Promise<ApiResponse<Category>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            cache: 'no-store',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'subcategories'>): Promise<ApiResponse<Category>> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
            body: JSON.stringify(category)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async updateCategory(id: string, category: Partial<Category>): Promise<ApiResponse<Category>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
            body: JSON.stringify(category)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async deleteCategory(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async getProviderCategories(
        providerId: string,
        options?: { activeOnly?: boolean }
    ): Promise<ApiResponse<ProductCategorySummary[]>> {
        const searchParams = new URLSearchParams();
        if (options?.activeOnly) {
            searchParams.set('activeOnly', String(options.activeOnly));
        }

        const url = searchParams.toString()
            ? `${this.providerBaseUrl}/${providerId}/categories?${searchParams.toString()}`
            : `${this.providerBaseUrl}/${providerId}/categories`;

        const response = await fetch(url, {
            cache: 'no-store',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async createProviderCategory(
        providerId: string,
        payload: ProviderCategoryCreateRequest,
    ): Promise<ApiResponse<ProductCategorySummary>> {
        const response = await fetch(`${this.providerBaseUrl}/${providerId}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async updateProviderCategory(
        providerId: string,
        categoryId: string,
        payload: ProviderCategoryUpdateRequest,
    ): Promise<ApiResponse<ProductCategorySummary>> {
        const response = await fetch(`${this.providerBaseUrl}/${providerId}/categories/${categoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    }

    async deleteProviderCategory(
        providerId: string,
        categoryId: string,
    ): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.providerBaseUrl}/${providerId}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
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