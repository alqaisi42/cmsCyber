// src/presentation/components/products/ProductVariantForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

import {
    ProductColor,
    ProductSize,
    ProductVariant,
    ProductVariantCreateDto,
} from '../../../core/entities';
import {
    useCreateProductVariant,
    useUpdateProductVariant,
} from '../../hooks/useProviders';
import { Button } from '../ui';

const SIZES: ProductSize[] = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductColor[] = [
    'black',
    'white',
    'red',
    'blue',
    'green',
    'yellow',
    'pink',
    'purple',
    'orange',
    'brown',
    'gray',
    'navy',
    'beige',
];

interface ProductVariantFormProps {
    productId: string;
    variant?: ProductVariant;
    mode: 'create' | 'edit';
}

export function ProductVariantForm({ productId, variant, mode }: ProductVariantFormProps) {
    const router = useRouter();
    const createVariant = useCreateProductVariant();
    const updateVariant = useUpdateProductVariant();

    const [formState, setFormState] = useState<ProductVariantCreateDto>({
        size: variant?.size || 'm',
        color: variant?.color || 'black',
        sku: variant?.sku || '',
        basePrice: variant?.basePrice ?? 0,
        priceAdjustment: variant?.priceAdjustment ?? 0,
        stockQuantity: variant?.stockQuantity ?? 0,
        lowStockThreshold: variant?.lowStockThreshold ?? 5,
        isAvailable: variant?.isAvailable ?? true,
        barcode: variant?.barcode || '',
        weight: variant?.weight ?? 0,
        inStockNo: variant?.inStockNo || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof ProductVariantCreateDto, value: any) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (errors[field as string]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const validationErrors: Record<string, string> = {};

        if (!formState.sku.trim()) {
            validationErrors.sku = 'SKU is required';
        }
        if (formState.basePrice < 0) {
            validationErrors.basePrice = 'Base price cannot be negative';
        }
        if (formState.stockQuantity < 0) {
            validationErrors.stockQuantity = 'Stock quantity cannot be negative';
        }
        if (formState.lowStockThreshold < 0) {
            validationErrors.lowStockThreshold = 'Low stock threshold cannot be negative';
        }

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        try {
            if (mode === 'create') {
                await createVariant.mutateAsync({
                    productId,
                    data: {
                        ...formState,
                        sku: formState.sku.trim(),
                        barcode: formState.barcode.trim(),
                        inStockNo: formState.inStockNo.trim(),
                    },
                });
                alert('Variant created successfully');
            } else if (variant) {
                await updateVariant.mutateAsync({
                    productId,
                    variantId: variant.id,
                    data: {
                        ...formState,
                        sku: formState.sku.trim(),
                        barcode: formState.barcode.trim(),
                        inStockNo: formState.inStockNo.trim(),
                    },
                });
                alert('Variant updated successfully');
            }

            router.push(`/dashboard/products/${productId}/variants`);
        } catch (error: any) {
            alert(error.message || 'Failed to save variant');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                        <select
                            value={formState.size}
                            onChange={(event) => handleChange('size', event.target.value as ProductSize)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <select
                            value={formState.color}
                            onChange={(event) => handleChange('color', event.target.value as ProductColor)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {COLORS.map((color) => (
                                <option key={color} value={color}>
                                    {color.charAt(0).toUpperCase() + color.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formState.sku}
                            onChange={(event) => handleChange('sku', event.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.sku ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Unique identifier"
                            required
                        />
                        {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formState.basePrice}
                            onChange={(event) => handleChange('basePrice', Number(event.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.basePrice ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.basePrice && <p className="text-xs text-red-600 mt-1">{errors.basePrice}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formState.priceAdjustment}
                            onChange={(event) => handleChange('priceAdjustment', Number(event.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formState.weight}
                            onChange={(event) => handleChange('weight', Number(event.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                        <input
                            type="number"
                            value={formState.stockQuantity}
                            onChange={(event) => handleChange('stockQuantity', Number(event.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.stockQuantity && (
                            <p className="text-xs text-red-600 mt-1">{errors.stockQuantity}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                        <input
                            type="number"
                            value={formState.lowStockThreshold}
                            onChange={(event) => handleChange('lowStockThreshold', Number(event.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.lowStockThreshold ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.lowStockThreshold && (
                            <p className="text-xs text-red-600 mt-1">{errors.lowStockThreshold}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-7">
                        <input
                            type="checkbox"
                            id="variant-available"
                            checked={formState.isAvailable}
                            onChange={(event) => handleChange('isAvailable', event.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="variant-available" className="text-sm font-medium text-gray-700">
                            Variant is available for purchase
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                        <input
                            type="text"
                            value={formState.barcode}
                            onChange={(event) => handleChange('barcode', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="UPC/EAN code"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Bin</label>
                        <input
                            type="text"
                            value={formState.inStockNo}
                            onChange={(event) => handleChange('inStockNo', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Inventory location"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<Save className="w-4 h-4" />}
                    isLoading={createVariant.isPending || updateVariant.isPending}
                >
                    {mode === 'create' ? 'Create Variant' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
