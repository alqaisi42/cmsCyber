// =============================================================================
// src/presentation/hooks/useShop.ts
// COMPLETE FILE - All React Query Hooks for Shop System
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    shopProviderService,
    shopProductService,
    productVariantService,
    categoryService,
} from '../../infrastructure/services/shop-admin.service';
import {
    ShopProvider,
    ShopProduct,
    ProductVariant,
    Category,
    CreateProductRequest,
    CreateVariantRequest,
    ProductSearchParams,
    ProviderStatsResponse,
} from '../../core/entities/ecommerce';
import { PaginatedResponse } from '../../core/interfaces/repositories';

// =============================================================================
// PROVIDER HOOKS
// =============================================================================

/**
 * Fetch all providers with statistics
 */
export function useProviders() {
    return useQuery<ProviderStatsResponse[], Error>({
        queryKey: ['providers'],
        queryFn: async () => {
            const response = await shopProviderService.getProviders();
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Fetch a single providers by ID
 */
export function useProviderById(providerId: string) {
    return useQuery<ShopProvider, Error>({
        queryKey: ['provider', providerId],
        queryFn: async () => {
            const response = await shopProviderService.getProviderById(providerId);
            return response.data;
        },
        enabled: !!providerId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch products for a specific providers with pagination
 */
export function useProviderProducts(
    providerId: string,
    page: number = 0,
    size: number = 20
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

/**
 * Create a new providers
 */
export function useCreateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (provider: Omit<ShopProvider, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await shopProviderService.createProvider(provider);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        },
    });
}

/**
 * Update an existing providers
 */
export function useUpdateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ShopProvider> }) => {
            const response = await shopProviderService.updateProvider(id, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', data.id] });
        },
    });
}

/**
 * Toggle providers active status
 */
export function useToggleProviderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const response = await shopProviderService.toggleProviderStatus(id, isActive);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', data.id] });
        },
    });
}

// =============================================================================
// PRODUCT HOOKS
// =============================================================================

/**
 * Fetch a single product by ID
 */
export function useProductById(productId: string) {
    return useQuery<ShopProduct, Error>({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await shopProductService.getProductById(productId);
            return response.data;
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Search products with filters and pagination
 */
export function useSearchProducts(params: ProductSearchParams) {
    return useQuery<PaginatedResponse<ShopProduct>, Error>({
        queryKey: ['products-search', params],
        queryFn: async () => {
            return await shopProductService.searchProducts(params);
        },
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Create a new product with variants
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: CreateProductRequest) => {
            const response = await shopProductService.createProduct(request);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-search'] });
            queryClient.invalidateQueries({ queryKey: ['providers-products'] });
        },
    });
}

/**
 * Update an existing product
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ShopProduct> }) => {
            const response = await shopProductService.updateProduct(id, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['product', data.id] });
            queryClient.invalidateQueries({ queryKey: ['products-search'] });
            queryClient.invalidateQueries({ queryKey: ['providers-products', data.providerId] });
        },
    });
}

/**
 * Delete a product
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            await shopProductService.deleteProduct(productId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-search'] });
            queryClient.invalidateQueries({ queryKey: ['providers-products'] });
        },
    });
}

// =============================================================================
// VARIANT HOOKS
// =============================================================================

/**
 * Fetch all variants for a product
 */
export function useProductVariants(productId: string) {
    return useQuery<ProductVariant[], Error>({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data || [];
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Create a new variant for a product
 */
export function useCreateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               productId,
                               request,
                           }: {
            productId: string;
            request: CreateVariantRequest;
        }) => {
            const response = await productVariantService.createVariant(productId, request);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
        },
    });
}

/**
 * Update an existing variant
 */
export function useUpdateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ProductVariant> }) => {
            const response = await productVariantService.updateVariant(id, data);
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

/**
 * Fetch all categories
 */
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

/**
 * Fetch a single category by ID
 */
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

/**
 * Create a new category
 */
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'subcategories'>
        ) => {
            const response = await categoryService.createCategory(category);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}

/**
 * Update an existing category
 */
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

/**
 * Delete a category
 */
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

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Prefetch providers products for better UX
 */
export function usePrefetchProviderProducts(providerId: string) {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: ['providers-products', providerId, 0, 20],
            queryFn: async () => {
                return await shopProviderService.getProviderProducts(providerId, 0, 20);
            },
        });
    };
}

/**
 * Prefetch product details for better UX
 */
export function usePrefetchProduct(productId: string) {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: ['product', productId],
            queryFn: async () => {
                const response = await shopProductService.getProductById(productId);
                return response.data;
            },
        });
    };
}

// =============================================================================
// EXPORT ALL HOOKS
// =============================================================================

export default {
    // Providers
    useProviders,
    useProviderById,
    useProviderProducts,
    useCreateProvider,
    useUpdateProvider,
    useToggleProviderStatus,

    // Products
    useProductById,
    useSearchProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,

    // Variants
    useProductVariants,
    useCreateVariant,
    useUpdateVariant,
    useDeleteVariant,

    // Categories
    useCategories,
    useCategoryById,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,

    // Utilities
    usePrefetchProviderProducts,
    usePrefetchProduct,
};