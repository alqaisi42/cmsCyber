// src/app/dashboard/products/[providerId]/variants/new/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { ArrowLeft, Save, X } from 'lucide-react';
import {ProductColor, ProductSize, ProductVariantCreateDto} from "../../../../../../core/entities";
import {useCreateProductVariant, useProduct} from "../../../../../../presentation/hooks/useProviders";
import {Button} from "../../../../../../presentation/components/ui";

const SIZES: ProductSize[] = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductColor[] = [
    'black', 'white', 'red', 'blue', 'green',
    'yellow', 'pink', 'purple', 'orange', 'brown',
    'gray', 'navy', 'beige'
];

export default function NewVariantPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const { data: product, isLoading: productLoading } = useProduct(productId);
    const createVariant = useCreateProductVariant();

    const [formData, setFormData] = useState<ProductVariantCreateDto>({
        size: 'm',
        color: 'black',
        sku: `SKU-${Date.now()}`,
        basePrice: product?.basePrice || 0,
        priceAdjustment: 0,
        stockQuantity: 0,
        lowStockThreshold: 5,
        isAvailable: true,
        barcode: '',
        weight: 0,
        inStockNo: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: keyof ProductVariantCreateDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
        if (formData.basePrice < 0) newErrors.basePrice = 'Price cannot be negative';
        if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock cannot be negative';
        if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            alert('Please fix all errors before submitting');
            return;
        }

        setIsSubmitting(true);

        try {
            await createVariant.mutateAsync({ productId, data: formData });
            alert('Variant created successfully!');
            router.push(`/dashboard/products/${productId}/variants`);
        } catch (error: any) {
            alert(error.message || 'Failed to create variant');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (productLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Variant</h1>
                    <p className="text-gray-600 mt-1">{product?.name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                        <select
                            value={formData.size}
                            onChange={(e) => handleChange('size', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {SIZES.map(size => (
                                <option key={size} value={size}>{size.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                        <select
                            value={formData.color}
                            onChange={(e) => handleChange('color', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {COLORS.map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                        <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) => handleChange('sku', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.sku ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter SKU"
                        />
                        {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label>
                        <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => handleChange('barcode', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.barcode ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter barcode"
                        />
                        {errors.barcode && <p className="text-sm text-red-600 mt-1">{errors.barcode}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.basePrice}
                            onChange={(e) => handleChange('basePrice', parseFloat(e.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.basePrice ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.basePrice && <p className="text-sm text-red-600 mt-1">{errors.basePrice}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.priceAdjustment}
                            onChange={(e) => handleChange('priceAdjustment', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                        <input
                            type="number"
                            value={formData.stockQuantity}
                            onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.stockQuantity && <p className="text-sm text-red-600 mt-1">{errors.stockQuantity}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                        <input
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.weight}
                            onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">In Stock No</label>
                        <input
                            type="text"
                            value={formData.inStockNo}
                            onChange={(e) => handleChange('inStockNo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Warehouse location"
                        />
                    </div>

                    <div className="flex items-center gap-2 md:col-span-2">
                        <input
                            type="checkbox"
                            id="isAvailable"
                            checked={formData.isAvailable}
                            onChange={(e) => handleChange('isAvailable', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                            Available for sale
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        <Save className="w-4 h-4 mr-1" />
                        Create Variant
                    </Button>
                </div>
            </form>
        </div>
    );
}