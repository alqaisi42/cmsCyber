// src/presentation/components/shop/VariantSelector.tsx
// NEW - Product Variant Selector Component

'use client';

import { useState, useEffect } from 'react';
import { Check, Package } from 'lucide-react';
import { ProductVariant } from '../../../core/entities/ecommerce';
import {canPurchaseVariant, isVariantLowStock} from "../../../shared/utils/variant.utils";


interface VariantSelectorProps {
    variants: ProductVariant[];
    onVariantChange: (variant: ProductVariant) => void;
    selectedVariant?: ProductVariant;
}

export function VariantSelector({
                                    variants,
                                    onVariantChange,
                                    selectedVariant
                                }: VariantSelectorProps) {
    // Extract unique colors and sizes
    const colors = [...new Set(variants.map(v => v.color))];
    const sizes = [...new Set(variants.map(v => v.size))];

    const [selectedColor, setSelectedColor] = useState<string>(
        selectedVariant?.color || colors[0]
    );
    const [selectedSize, setSelectedSize] = useState<string>(
        selectedVariant?.size || sizes[0]
    );

    // Find matching variant
    useEffect(() => {
        const variant = variants.find(
            v => v.color === selectedColor && v.size === selectedSize
        );
        if (variant) {
            onVariantChange(variant);
        }
    }, [selectedColor, selectedSize, variants, onVariantChange]);

    // Get available sizes for selected color
    const availableSizes = variants
        .filter(v => v.color === selectedColor)
        .map(v => v.size);

    // Get available colors for selected size
    const availableColors = variants
        .filter(v => v.size === selectedSize)
        .map(v => v.color);

    // Color mapping for visual display
    const colorStyles: Record<string, string> = {
        black: 'bg-slate-900',
        white: 'bg-white border-2 border-slate-300',
        blue: 'bg-blue-600',
        red: 'bg-red-600',
        green: 'bg-green-600',
        yellow: 'bg-yellow-400',
        gray: 'bg-slate-400',
        pink: 'bg-pink-500',
        purple: 'bg-purple-600',
        orange: 'bg-orange-500',
        brown: 'bg-amber-700'
    };

    return (
        <div className="space-y-6">
            {/* Color Selector */}
            <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                    Color: <span className="font-semibold capitalize">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                    {colors.map(color => {
                        const isAvailable = availableColors.includes(color);
                        const isSelected = color === selectedColor;
                        const colorStyle = colorStyles[color.toLowerCase()] || 'bg-slate-200';

                        return (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                disabled={!isAvailable}
                                className={`
                  relative w-12 h-12 rounded-full transition-all
                  ${colorStyle}
                  ${isSelected ? 'ring-2 ring-offset-2 ring-blue-600' : ''}
                  ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}
                `}
                                title={color}
                            >
                                {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check
                                            className={`w-6 h-6 ${
                                                color.toLowerCase() === 'white' ? 'text-slate-900' : 'text-white'
                                            }`}
                                        />
                                    </div>
                                )}
                                {!isAvailable && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-0.5 h-full bg-red-500 rotate-45" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Size Selector */}
            <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                    Size: <span className="font-semibold uppercase">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {sizes.map(size => {
                        const isAvailable = availableSizes.includes(size);
                        const isSelected = size === selectedSize;

                        return (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                disabled={!isAvailable}
                                className={`
                  px-6 py-3 rounded-lg font-medium uppercase text-sm transition-all
                  ${isSelected
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                                    : 'bg-white text-slate-900 border-2 border-slate-300 hover:border-blue-600'
                                }
                  ${!isAvailable ? 'opacity-30 cursor-not-allowed line-through' : ''}
                `}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Variant Info */}
            {selectedVariant && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-slate-600" />
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {selectedVariant.sku}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                    {selectedVariant.stockQuantity > 0
                                        ? `${selectedVariant.stockQuantity} in stock`
                                        : 'Out of stock'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">
                                ${selectedVariant.finalPrice.toFixed(2)}
                            </p>
                            {selectedVariant.priceAdjustment !== 0 && (
                                <p className="text-xs text-slate-600">
                                    {selectedVariant.priceAdjustment > 0 ? '+' : ''}
                                    ${selectedVariant.priceAdjustment.toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stock indicator */}
                    {isVariantLowStock(selectedVariant) && (
                        <div className="mt-3 text-xs text-amber-600 font-medium">
                            ⚠️ Only {selectedVariant.stockQuantity} left in stock
                        </div>
                    )}

                    {!canPurchaseVariant(selectedVariant) && (
                        <div className="mt-3 text-xs text-red-600 font-medium">
                            ❌ Currently unavailable
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}