// src/core/utils/variant.utils.ts
// NEW - Utility functions for product variants


import { ProductVariant } from '../../core/entities/ecommerce';

export function canPurchaseVariant(variant: ProductVariant): boolean {
    return variant.isAvailable && variant.stockQuantity > 0;
}

export function isVariantLowStock(variant: ProductVariant): boolean {
    return variant.stockQuantity <= variant.lowStockThreshold && variant.stockQuantity > 0;
}

export function getUniqueColors(variants: ProductVariant[]): string[] {
    return [...new Set(variants.map(v => v.color))];
}

export function getUniqueSizes(variants: ProductVariant[]): string[] {
    return [...new Set(variants.map(v => v.size))];
}

export function findVariantByAttributes(
    variants: ProductVariant[],
    size: string,
    color: string
): ProductVariant | undefined {
    return variants.find(v => v.size === size && v.color === color);
}

export function getStockStatus(variant: ProductVariant): {
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    label: string;
    color: string;
} {
    if (variant.stockQuantity === 0 || !variant.isAvailable) {
        return { status: 'out-of-stock', label: 'Out of Stock', color: 'red' };
    }
    if (isVariantLowStock(variant)) {
        return { status: 'low-stock', label: 'Low Stock', color: 'yellow' };
    }
    return { status: 'in-stock', label: 'In Stock', color: 'green' };
}
