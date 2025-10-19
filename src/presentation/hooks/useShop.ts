// =============================================================================
// File: src/presentation/hooks/useShop.ts
// UPDATED - Added missing hooks for variants
// =============================================================================

import {useQuery, useMutation, useQueryClient, UseQueryOptions} from '@tanstack/react-query';
import {
    shopProviderService,
    shopProductService,
    productVariantService,
    categoryService,
} from '../../infrastructure/services/shop-admin.service';
import {
    productImageService,
    UploadImageMetadata,
} from '../../infrastructure/services/product-image.service';
import {
    ShopProvider,
    ShopProduct,
    ShopProductDetail,
    ProductVariant,
    Category,
    CreateProductRequest,
    CreateVariantRequest,
    CreateImageRequest,
    ProductSearchParams,
    ProviderSummary,
    ProviderStatistics,
} from '../../core/entities/ecommerce';
import { CreateProviderRequest, ProviderSearchRequest, UpdateProviderRequest } from '@/core/types/provider.types';
import { ApiResponse, PaginatedResponse } from '../../core/interfaces/repositories';

// =============================================================================
// PROVIDER HOOKS
// =============================================================================

export function useProviders() {
    return useQuery<ProviderSummary[], Error>({
        queryKey: ['providers'],
        queryFn: async () => {
            const response = await shopProviderService.getProviders();
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSearchProviders(params: ProviderSearchRequest) {
    return useQuery<PaginatedResponse<ProviderSummary>, Error>({
        queryKey: ['providers', 'search', params],
        queryFn: async () => shopProviderService.searchProviders(params),
        staleTime: 2 * 60 * 1000,
    });
}
type ProviderQueryOptions<TData = ShopProvider> = Omit<
    UseQueryOptions<TData, Error>,
    'queryKey' | 'queryFn'
>;

export function useProviderById(
    providerId: string,
    options?: ProviderQueryOptions
) {
    return useQuery<ShopProvider, Error>({
        queryKey: ['provider', providerId],
        queryFn: async () => {
            if (!providerId) {
                throw new Error('Provider ID is required');
            }
            const response = await shopProviderService.getProviderById(providerId);
            return response.data;
        },
        enabled: !!providerId && (options?.enabled !== false),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
            // Don't retry on 404 errors
            if (error?.message?.includes('404')) return false;
            return failureCount < 3;
        },
        ...options, // Spread any additional options
    });
}

export function useProviderProducts(
    providerId: string,
    page: number = 0,
    size: number = 20,
) {
    return useQuery<PaginatedResponse<ShopProduct>, Error>({
        queryKey: ['providers-products', providerId, page, size],
        queryFn: async () => {
            return await shopProviderService.getProviderProducts(providerId, page, size);
        },
        enabled: !!providerId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useProviderStatistics(
    providerId: string,
    periodStart?: string,
    periodEnd?: string,
) {
    return useQuery<ApiResponse<ProviderStatistics>, Error>({
        queryKey: ['provider-statistics', providerId, periodStart, periodEnd],
        queryFn: async () => {
            const response = await shopProviderService.getProviderStatistics(providerId, periodStart, periodEnd);
            return response;
        },
        enabled: !!providerId,
        staleTime: 1 * 60 * 1000,
    });
}


export function useCreateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (provider: CreateProviderRequest) => {
            const response = await shopProviderService.createProvider(provider);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        },
    });
}

export function useUpdateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateProviderRequest }) => {
            const response = await shopProviderService.updateProvider(id, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', data.id] });
        },
    });
}

export function useToggleProviderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await shopProviderService.toggleProviderStatus(id);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', data.id] });
        },
    });
}

export function useUpdateProviderRating() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
            const response = await shopProviderService.updateProviderRating(id, rating);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', data.id] });
        },
    });
}

export function useDeleteProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, hardDelete = false }: { id: string; hardDelete?: boolean }) => {
            await shopProviderService.deleteProvider(id, hardDelete);
            return id;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', id] });
        },
    });
}

// =============================================================================
// PRODUCT HOOKS
// =============================================================================

export function useProductById(productId: string) {
    return useQuery<ApiResponse<ShopProductDetail>, Error>({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await shopProductService.getProductById(productId);
            return response;
        },
        enabled: !!productId,
        staleTime: 2 * 60 * 1000,
    });
}

export function useProducts(page: number = 0, size: number = 20) {
    return useQuery<PaginatedResponse<ShopProduct>, Error>({
        queryKey: ['products', page, size],
        queryFn: async () => {
            return await shopProductService.getProducts(page, size);
        },
        staleTime: 2 * 60 * 1000,
    });
}

export function useSearchProducts(params: ProductSearchParams) {
    return useQuery<PaginatedResponse<ShopProduct>, Error>({
        queryKey: ['products-search', params],
        queryFn: async () => {
            return await shopProductService.searchProducts(params);
        },
        staleTime: 1 * 60 * 1000,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: CreateProductRequest) => {
            const response = await shopProductService.createProduct(product);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['provider-products'] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ShopProduct> }) => {
            const response = await shopProductService.updateProduct(id, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', data.id] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            await shopProductService.deleteProduct(productId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['provider-products'] });
        },
    });
}

// =============================================================================
// VARIANT HOOKS - NEW
// =============================================================================

/**
 * Fetch all variants for a specific product
 */
export function useProductVariants(productId: string) {
    return useQuery({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response;
        },
        enabled: !!productId,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Create a new variant for a product
 */
export function useCreateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, variant }: { productId: string; variant: CreateVariantRequest }) => {
            const response = await productVariantService.createVariant(productId, variant);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
        },
    });
}

// =============================================================================
// PRODUCT IMAGE HOOKS - NEW
// =============================================================================

export function useCreateProductImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            productId,
            image,
        }: {
            productId: string;
            image: CreateImageRequest;
        }) => {
            const response = await productImageService.createProductImage(productId, image);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
        },
    });
}

export function useUploadProductImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            productId,
            files,
            metadata,
        }: {
            productId: string;
            files: File[];
            metadata?: UploadImageMetadata[];
        }) => {
            const response = await productImageService.uploadProductImages(productId, files, metadata ?? []);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
        },
    });
}

/**
 * Update an existing variant
 */
export function useUpdateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ variantId, variant }: { variantId: string; variant: Partial<ProductVariant> }) => {
            const response = await productVariantService.updateVariant(variantId, variant);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', data.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', data.productId] });
        },
    });
}

/**
 * Delete a variant
 */
export function useDeleteVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ variantId, productId }: { variantId: string; productId: string }) => {
            await productVariantService.deleteVariant(variantId);
            return productId;
        },
        onSuccess: (productId) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
            queryClient.invalidateQueries({ queryKey: ['product', productId] });
        },
    });
}

// =============================================================================
// CATEGORY HOOKS
// =============================================================================

export function useCategories() {
    return useQuery<Category[], Error>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getCategories();
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useCategoryById(categoryId: string) {
    return useQuery<Category, Error>({
        queryKey: ['category', categoryId],
        queryFn: async () => {
            const response = await categoryService.getCategoryById(categoryId);
            return response.data;
        },
        enabled: !!categoryId,
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'subcategories'>) => {
            const response = await categoryService.createCategory(category);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
            const response = await categoryService.updateCategory(id, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['category', data.id] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categoryId: string) => {
            await categoryService.deleteCategory(categoryId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}