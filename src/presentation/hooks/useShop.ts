// src/presentation/hooks/useShop.ts
// NEW hooks for shop management with React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    shopProviderService,
    shopProductService,
    productVariantService,
    categoryService
} from '../../infrastructure/services/shop-admin.service';
import {
    ShopProvider,
    ShopProduct,
    ProductVariant,
    Category,
    CreateProductRequest,
    CreateVariantRequest,
    ProductSearchParams
} from '../../core/entities/ecommerce';
import {PaginatedResponse} from "../../core/interfaces/repositories";

// ============================================================================
// PROVIDER HOOKS
// ============================================================================

export function useProviders() {
    return useQuery({
        queryKey: ['providers'],
        queryFn: async () => {
            const response = await shopProviderService.getProviders();
            return response.data;
        }
    });
}

export function useProvider(id: string) {
    return useQuery({
        queryKey: ['provider', id],
        queryFn: async () => {
            const response = await shopProviderService.getProviderById(id);
            return response.data;
        },
        enabled: !!id
    });
}

export function useProviderProducts(
    providerId: string,
    page = 0,
    size = 20
) {
    return useQuery({
        queryKey: ['provider-products', providerId, page, size],
        queryFn: async (): Promise<PaginatedResponse<ShopProduct>> => {
            const response = await shopProviderService.getProviderProducts(providerId, page, size);

            // Ensure normalized structure regardless of backend format
            const data = (response?.data ?? []) as ShopProduct[];

            return {
                data,
                total: response?.total ?? data.length,
                totalPages: response?.totalPages ?? 1,
                page,
                limit: size,
            };
        },
        enabled: !!providerId,
    });
}



export function useCreateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (provider: Omit<ShopProvider, 'id' | 'createdAt' | 'updatedAt'>) =>
            shopProviderService.createProvider(provider),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        }
    });
}

export function useUpdateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ShopProvider> }) =>
            shopProviderService.updateProvider(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', variables.id] });
        }
    });
}

export function useToggleProviderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            shopProviderService.toggleProviderStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        }
    });
}

// ============================================================================
// PRODUCT HOOKS
// ============================================================================

export function useProduct(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await shopProductService.getProductById(id);
            return response.data;
        },
        enabled: !!id
    });
}

export function useSearchProducts(params: ProductSearchParams) {
    return useQuery({
        queryKey: ['products', 'search', params],
        queryFn: async () => {
            const response = await shopProductService.searchProducts(params);
            return response.data;
        }
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateProductRequest) =>
            shopProductService.createProduct(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['provider-products'] });
        }
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ShopProduct> }) =>
            shopProductService.updateProduct(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
        }
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => shopProductService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
}

// ============================================================================
// VARIANT HOOKS
// ============================================================================

export function useProductVariants(productId: string) {
    return useQuery({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data;
        },
        enabled: !!productId
    });
}

export function useCreateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, variant }: { productId: string; variant: CreateVariantRequest }) =>
            productVariantService.createVariant(productId, variant),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
        }
    });
}

export function useUpdateVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductVariant> }) =>
            productVariantService.updateVariant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-variants'] });
        }
    });
}

export function useDeleteVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productVariantService.deleteVariant(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-variants'] });
        }
    });
}

export function useUpdateVariantStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
            productVariantService.updateStock(id, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-variants'] });
        }
    });
}

// ============================================================================
// CATEGORY HOOKS
// ============================================================================

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getCategories();
            return response.data;
        }
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) =>
            categoryService.createCategory(category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
            categoryService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => categoryService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
}