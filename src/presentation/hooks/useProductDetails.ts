// =============================================================================
// src/presentation/hooks/useProductDetails.ts
// COMPLETE FILE - Product Details Hook with Images and Variants
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { shopProductService } from '../../infrastructure/services/shop-admin.service';
import { productVariantService } from '../../infrastructure/services/shop-admin.service';
import {
    productImageService,
    ProductImage,
    GroupedImages
} from '../../infrastructure/services/product-image.service';
import { ShopProduct, ProductVariant } from '../../core/entities/ecommerce';

// =============================================================================
// PRODUCT IMAGES HOOK
// =============================================================================

/**
 * Fetch product images
 */
export function useProductImages(productId: string) {
    return useQuery<ProductImage[], Error>({
        queryKey: ['product-images', productId],
        queryFn: async () => {
            const response = await productImageService.getProductImages(productId);
            return response.data || [];
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

// =============================================================================
// MAIN PRODUCT DETAILS HOOK
// =============================================================================

/**
 * Fetch product with variants and images
 * This is the main hook for the product details page
 *
 * @param productId - The product ID
 * @returns Object with product, variants, images, and grouped images
 *
 * @example
 * ```tsx
 * const { product, variants, images, groupedImages, isLoading, error } = useProductDetails(productId);
 *
 * // Get images for selected variant
 * const variantImages = selectedVariant
 *   ? productImageService.getVariantImages(images, selectedVariant.id)
 *   : [];
 * ```
 */
export function useProductDetails(productId: string) {
    // Fetch product
    const productQuery = useQuery<ShopProduct, Error>({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await shopProductService.getProductById(productId);
            return response.data;
        },
        enabled: !!productId,
    });

    // Fetch variants
    const variantsQuery = useQuery<ProductVariant[], Error>({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data || [];
        },
        enabled: !!productId,
    });

    // Fetch images
    const imagesQuery = useQuery<ProductImage[], Error>({
        queryKey: ['product-images', productId],
        queryFn: async () => {
            const response = await productImageService.getProductImages(productId);
            return response.data || [];
        },
        enabled: !!productId,
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
        error: productQuery.error || variantsQuery.error || imagesQuery.error,
        isError: productQuery.isError || variantsQuery.isError || imagesQuery.isError,
    };
}

// =============================================================================
// VARIANT OPTIONS HOOK
// =============================================================================

/**
 * Get unique colors and sizes from variants
 * Useful for building filter UI
 *
 * @param productId - The product ID
 * @returns Object with unique colors and sizes
 *
 * @example
 * ```tsx
 * const { colors, sizes, isLoading } = useVariantOptions(productId);
 * ```
 */
export function useVariantOptions(productId: string) {
    const { data: variants, isLoading, error } = useQuery<ProductVariant[], Error>({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data || [];
        },
        enabled: !!productId,
    });

    const colors = variants ? [...new Set(variants.map((v) => v.color))] : [];
    const sizes = variants ? [...new Set(variants.map((v) => v.size))] : [];

    return {
        colors,
        sizes,
        variants: variants || [],
        isLoading,
        error,
    };
}

// =============================================================================
// VARIANT BY ATTRIBUTES HOOK
// =============================================================================

/**
 * Find a specific variant by size and color
 *
 * @param productId - The product ID
 * @param size - The size to find
 * @param color - The color to find
 * @returns The matching variant or undefined
 *
 * @example
 * ```tsx
 * const { variant, isLoading } = useVariantByAttributes(productId, 'M', 'Blue');
 * ```
 */
export function useVariantByAttributes(
    productId: string,
    size?: string,
    color?: string
) {
    const { data: variants, isLoading, error } = useQuery<ProductVariant[], Error>({
        queryKey: ['product-variants', productId],
        queryFn: async () => {
            const response = await productVariantService.getProductVariants(productId);
            return response.data || [];
        },
        enabled: !!productId,
    });

    const variant =
        variants && size && color
            ? variants.find((v) => v.size === size && v.color === color)
            : undefined;

    return {
        variant,
        variants: variants || [],
        isLoading,
        error,
    };
}

// =============================================================================
// EXPORT ALL HOOKS
// =============================================================================

export default {
    useProductDetails,
    useProductImages,
    useVariantOptions,
    useVariantByAttributes,
};