// src/presentation/hooks/useProductDetails.ts
// NEW - Custom hooks for product details page

import { useQuery } from '@tanstack/react-query';
import { shopProductService } from '../../infrastructure/services/shop-admin.service';
import { productVariantService } from '../../infrastructure/services/shop-admin.service';
import { productImageService, ProductImage, GroupedImages } from '../../infrastructure/services/product-image.service';

/**
 * Fetch product images
 */
export function useProductImages(productId: string) {
    return useQuery({
        queryKey: ['product-images', productId],
        queryFn: async () => {
            const response = await productImageService.getProductImages(productId);
            return response.data || [];
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });
}

/**
 * Fetch product with variants and images
 * This is the main hook for the product details page
 */
export function useProductDetails(productId: string) {
    // Fetch product
    const productQuery = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await shopProductService.getProductById(productId);
            return response.data;
        },
        enabled: !!productId
    });

    // Fetch variants
    const variantsQuery = useQuery({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data || [];
        },
        enabled: !!productId
    });

    // Fetch images
    const imagesQuery = useQuery({
        queryKey: ['product-images', productId],
        queryFn: async () => {
            const response = await productImageService.getProductImages(productId);
            return response.data || [];
        },
        enabled: !!productId
    });

    // Compute grouped images
    const groupedImages: GroupedImages | null = imagesQuery.data
        ? productImageService.groupImages(imagesQuery.data)
        : null;

    return {
        product: productQuery.data,
        variants: variantsQuery.data || [],
        images: imagesQuery.data || [],
        groupedImages,
        isLoading: productQuery.isLoading || variantsQuery.isLoading || imagesQuery.isLoading,
        error: productQuery.error || variantsQuery.error || imagesQuery.error
    };
}

/**
 * Get unique colors and sizes from variants
 */
export function useVariantOptions(productId: string) {
    const { data: variants } = useQuery({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data || [];
        },
        enabled: !!productId
    });

    const colors = [...new Set(variants?.map(v => v.color) || [])];
    const sizes = [...new Set(variants?.map(v => v.size) || [])];

    return { colors, sizes, variants };
}