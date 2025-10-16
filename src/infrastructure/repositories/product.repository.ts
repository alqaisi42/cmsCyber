// src/infrastructure/repositories/product.repository.ts
import { apiClient } from '../api/client';
import {
    ApiResponse,
    PaginatedData,
    Provider,
    Product,
    ProductVariant,
    ProductCreateDto,
    ProductVariantCreateDto,
    ProductSearchParams,
    ProductDetail,
    Category
} from '../../core/entities';

// ============================================================================
// PROVIDER REPOSITORY
// ============================================================================

export class ProviderRepository {
    private readonly baseUrl = '/providers';

    async getAll(): Promise<Provider[]> {
        const response = await apiClient.get<ApiResponse<Provider[]>>(this.baseUrl);
        return response.data;
    }

    async getById(id: string): Promise<Provider> {
        const response = await apiClient.get<ApiResponse<Provider>>(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async getProductsByProvider(
        providerId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PaginatedData<Product>> {
        const response = await apiClient.get<ApiResponse<PaginatedData<Product>>>(
            `${this.baseUrl}/${providerId}/products?page=${page}&size=${size}`
        );
        return response.data;
    }

    async create(data: Partial<Provider>): Promise<Provider> {
        const response = await apiClient.post<ApiResponse<Provider>>(this.baseUrl, data);
        return response.data;
    }

    async update(id: string, data: Partial<Provider>): Promise<Provider> {
        const response = await apiClient.patch<ApiResponse<Provider>>(`${this.baseUrl}/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

// ============================================================================
// PRODUCT REPOSITORY
// ============================================================================

export class ProductRepository {
    private readonly baseUrl = '/products';

    async search(params: ProductSearchParams): Promise<PaginatedData<Product>> {
        const queryParams = new URLSearchParams();

        if (params.query) queryParams.append('query', params.query);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.providerIds) params.providerIds.forEach(id => queryParams.append('providerIds', id));
        if (params.sizes) params.sizes.forEach(size => queryParams.append('sizes', size));
        if (params.colors) params.colors.forEach(color => queryParams.append('colors', color));
        if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
        if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        queryParams.append('page', (params.page || 0).toString());
        queryParams.append('size', (params.size || 20).toString());

        const response = await apiClient.get<ApiResponse<PaginatedData<Product>>>(
            `${this.baseUrl}/search?${queryParams.toString()}`
        );
        return response.data;
    }

    async getById(id: string): Promise<ProductDetail> {
        const response = await apiClient.get<ApiResponse<ProductDetail>>(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async create(data: ProductCreateDto): Promise<Product> {
        const response = await apiClient.post<ApiResponse<Product>>(this.baseUrl, data);
        return response.data;
    }

    async update(id: string, data: Partial<ProductCreateDto>): Promise<Product> {
        const response = await apiClient.patch<ApiResponse<Product>>(`${this.baseUrl}/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

// ============================================================================
// PRODUCT VARIANT REPOSITORY
// ============================================================================

export class ProductVariantRepository {
    private readonly baseUrl = '/products';

    async getByProductId(productId: string): Promise<ProductVariant[]> {
        const response = await apiClient.get<ApiResponse<ProductVariant[]>>(
            `${this.baseUrl}/${productId}/variants`
        );
        return response.data;
    }

    async getById(productId: string, variantId: string): Promise<ProductVariant> {
        const response = await apiClient.get<ApiResponse<ProductVariant>>(
            `${this.baseUrl}/${productId}/variants/${variantId}`
        );
        return response.data;
    }

    async create(productId: string, data: ProductVariantCreateDto): Promise<ProductVariant> {
        const response = await apiClient.post<ApiResponse<ProductVariant>>(
            `${this.baseUrl}/${productId}/variants`,
            data
        );
        return response.data;
    }

    async update(
        productId: string,
        variantId: string,
        data: Partial<ProductVariantCreateDto>
    ): Promise<ProductVariant> {
        const response = await apiClient.patch<ApiResponse<ProductVariant>>(
            `${this.baseUrl}/${productId}/variants/${variantId}`,
            data
        );
        return response.data;
    }

    async delete(productId: string, variantId: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${productId}/variants/${variantId}`);
    }
}

// ============================================================================
// CATEGORY REPOSITORY
// ============================================================================

export class CategoryRepository {
    private readonly baseUrl = '/categories';

    async getAll(): Promise<Category[]> {
        const response = await apiClient.get<ApiResponse<Category[]>>(this.baseUrl);
        return response.data;
    }

    async getTree(): Promise<Category[]> {
        try {
            const response = await apiClient.get<ApiResponse<Category[]>>(`${this.baseUrl}/tree`);
            return response.data;
        } catch (error) {
            // Fallback to flat list if tree endpoint is not available
            return this.getAll();
        }
    }

    async getById(id: string): Promise<Category> {
        const response = await apiClient.get<ApiResponse<Category>>(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async create(data: Partial<Category>): Promise<Category> {
        const response = await apiClient.post<ApiResponse<Category>>(this.baseUrl, data);
        return response.data;
    }

    async createSubcategory(parentId: string, data: Partial<Category>): Promise<Category> {
        const response = await apiClient.post<ApiResponse<Category>>(`${this.baseUrl}/${parentId}/subcategories`, data);
        return response.data;
    }

    async update(id: string, data: Partial<Category>): Promise<Category> {
        const response = await apiClient.patch<ApiResponse<Category>>(`${this.baseUrl}/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

// Export singleton instances
export const providerRepository = new ProviderRepository();
export const productRepository = new ProductRepository();
export const productVariantRepository = new ProductVariantRepository();
export const categoryRepository = new CategoryRepository();