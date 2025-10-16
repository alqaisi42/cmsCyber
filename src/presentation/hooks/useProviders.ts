// src/presentation/hooks/useProviders.ts
// Custom hooks for data fetching with React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    providerRepository,
    productRepository,
    productVariantRepository
} from '../../infrastructure/repositories/product.repository';
import {
    Provider,
    Product,
    ProductVariant,
    ProductCreateDto,
    ProductVariantCreateDto,
    ProductSearchParams
} from '../../core/entities';

// ============================================================================
// PROVIDER HOOKS
// ============================================================================

export function useProviders() {
    return useQuery({
        queryKey: ['providers'],
        queryFn: () => providerRepository.getAll(),
    });
}

export function useProvider(id: string) {
    return useQuery({
        queryKey: ['provider', id],
        queryFn: () => providerRepository.getById(id),
        enabled: !!id,
    });
}

export function useProviderProducts(providerId: string, page: number = 0, size: number = 20) {
    return useQuery({
        queryKey: ['provider-products', providerId, page, size],
        queryFn: () => providerRepository.getProductsByProvider(providerId, page, size),
        enabled: !!providerId,
    });
}

export function useCreateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Provider>) => providerRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        },
    });
}

export function useUpdateProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Provider> }) =>
            providerRepository.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['provider', variables.id] });
        },
    });
}

export function useDeleteProvider() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => providerRepository.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        },
    });
}

// ============================================================================
// PRODUCT HOOKS
// ============================================================================

export function useProductSearch(params: ProductSearchParams) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: () => productRepository.search(params),
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: () => productRepository.getById(id),
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ProductCreateDto) => productRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductCreateDto> }) =>
            productRepository.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productRepository.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

// ============================================================================
// PRODUCT VARIANT HOOKS
// ============================================================================

export function useProductVariants(productId: string) {
    return useQuery({
        queryKey: ['product-variants', productId],
        queryFn: () => productVariantRepository.getByProductId(productId),
        enabled: !!productId,
    });
}

export function useProductVariant(productId: string, variantId: string) {
    return useQuery({
        queryKey: ['product-variant', productId, variantId],
        queryFn: () => productVariantRepository.getById(productId, variantId),
        enabled: !!productId && !!variantId,
    });
}

export function useCreateProductVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, data }: { productId: string; data: ProductVariantCreateDto }) =>
            productVariantRepository.create(productId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
        },
    });
}

export function useUpdateProductVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         productId,
                         variantId,
                         data
                     }: {
            productId: string;
            variantId: string;
            data: Partial<ProductVariantCreateDto>
        }) => productVariantRepository.update(productId, variantId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-variant', variables.productId, variables.variantId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
        },
    });
}

export function useDeleteProductVariant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
            productVariantRepository.delete(productId, variantId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
        },
    });
}