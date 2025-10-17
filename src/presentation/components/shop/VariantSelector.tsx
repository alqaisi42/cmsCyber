
'use client';

import { useState } from 'react';
import { Check, Package } from 'lucide-react';
import { ProductVariant } from '../../../core/entities/ecommerce';
import { canPurchaseVariant, getStockStatus, getUniqueColors, getUniqueSizes, findVariantByAttributes } from '../../../shared/utils/variant.utils';

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedVariant?: ProductVariant;
    onVariantChange: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, selectedVariant, onVariantChange }: VariantSelectorProps) {
    const [selectedSize, setSelectedSize] = useState<string>(selectedVariant?.size || '');
    const [selectedColor, setSelectedColor] = useState<string>(selectedVariant?.color || '');

    const colors = getUniqueColors(variants);
    const sizes = getUniqueSizes(variants);

    const handleSizeClick = (size: string) => {
        setSelectedSize(size);
        if (selectedColor) {
            const variant = findVariantByAttributes(variants, size, selectedColor);
            if (variant) onVariantChange(variant);
        }
    };

    const handleColorClick = (color: string) => {
        setSelectedColor(color);
        if (selectedSize) {
            const variant = findVariantByAttributes(variants, selectedSize, color);
            if (variant) onVariantChange(variant);
        }
    };

    return (
        <div className="space-y-6">
            {/* Size Selector */}
            <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                    Size {selectedSize && <span className="text-blue-600">({selectedSize.toUpperCase()})</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        const variant = findVariantByAttributes(variants, size, selectedColor || colors[0]);
                        const canPurchase = variant ? canPurchaseVariant(variant) : false;

                        return (
                            <button
                                key={size}
                                onClick={() => handleSizeClick(size)}
                                disabled={!canPurchase}
                                className={`px-4 py-2 rounded-lg border-2 font-medium uppercase transition-all ${
                                    isSelected
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : canPurchase
                                            ? 'border-slate-300 hover:border-blue-400 text-slate-700'
                                            : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Color Selector */}
            <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                    Color {selectedColor && <span className="text-blue-600 capitalize">({selectedColor})</span>}
                </label>
                <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                        const isSelected = selectedColor === color;
                        const variant = findVariantByAttributes(variants, selectedSize || sizes[0], color);
                        const canPurchase = variant ? canPurchaseVariant(variant) : false;

                        return (
                            <button
                                key={color}
                                onClick={() => handleColorClick(color)}
                                disabled={!canPurchase}
                                className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                                    isSelected
                                        ? 'border-blue-600 ring-2 ring-blue-200'
                                        : 'border-slate-300 hover:border-blue-400'
                                } ${!canPurchase ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={color}
                                style={{ backgroundColor: color.toLowerCase() }}
                            >
                                {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-white drop-shadow" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stock Status */}
            {selectedVariant && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">
            {selectedVariant.stockQuantity} units available
          </span>
                    <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                        getStockStatus(selectedVariant).status === 'in-stock'
                            ? 'bg-green-100 text-green-700'
                            : getStockStatus(selectedVariant).status === 'low-stock'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                    }`}>
            {getStockStatus(selectedVariant).label}
          </span>
                </div>
            )}
        </div>
    );
}