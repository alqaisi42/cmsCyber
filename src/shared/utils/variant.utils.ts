// src/core/utils/variant.utils.ts
// NEW - Utility functions for product variants


import {ProductVariant} from "../../core/entities/ecommerce";

/**
 * Check if variant is low on stock
 */
export function isVariantLowStock(variant: ProductVariant): boolean {
    return variant.stockQuantity > 0 &&
        variant.stockQuantity <= variant.lowStockThreshold;
}

/**
 * Check if variant is out of stock
 */
export function isVariantOutOfStock(variant: ProductVariant): boolean {
    return variant.stockQuantity === 0;
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(variant: ProductVariant): string {
    if (isVariantOutOfStock(variant)) return 'Out of Stock';
    if (isVariantLowStock(variant)) return 'Low Stock';
    return 'In Stock';
}

/**
 * Get stock status color class
 */
export function getStockStatusColor(variant: ProductVariant): string {
    if (isVariantOutOfStock(variant)) return 'text-red-600';
    if (isVariantLowStock(variant)) return 'text-amber-600';
    return 'text-green-600';
}

/**
 * Check if variant can be purchased
 */
export function canPurchaseVariant(variant: ProductVariant): boolean {
    return variant.isAvailable &&
        variant.stockQuantity > 0;
}

/**
 * Get available variants only
 */
export function getAvailableVariants(variants: ProductVariant[]): ProductVariant[] {
    return variants.filter(canPurchaseVariant);
}

/**
 * Calculate final price (with adjustment)
 */
export function calculateFinalPrice(variant: ProductVariant): number {
    return variant.basePrice + variant.priceAdjustment;
}

/**
 * Format price with currency
 */
export function formatVariantPrice(variant: ProductVariant, currency: string = 'USD'): string {
    const finalPrice = calculateFinalPrice(variant);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(finalPrice);
}

/**
 * Get variants grouped by color
 */
export function groupVariantsByColor(variants: ProductVariant[]): Record<string, ProductVariant[]> {
    return variants.reduce((acc, variant) => {
        if (!acc[variant.color]) {
            acc[variant.color] = [];
        }
        acc[variant.color].push(variant);
        return acc;
    }, {} as Record<string, ProductVariant[]>);
}

/**
 * Get variants grouped by size
 */
export function groupVariantsBySize(variants: ProductVariant[]): Record<string, ProductVariant[]> {
    return variants.reduce((acc, variant) => {
        if (!acc[variant.size]) {
            acc[variant.size] = [];
        }
        acc[variant.size].push(variant);
        return acc;
    }, {} as Record<string, ProductVariant[]>);
}

/**
 * Find variant by color and size
 */
export function findVariant(
    variants: ProductVariant[],
    color: string,
    size: string
): ProductVariant | undefined {
    return variants.find(v =>
        v.color.toLowerCase() === color.toLowerCase() &&
        v.size.toLowerCase() === size.toLowerCase()
    );
}