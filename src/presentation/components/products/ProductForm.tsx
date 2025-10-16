// src/presentation/components/products/ProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Plus, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui';
import {
    Product,
    ProductColor,
    ProductCreateDto,
    ProductImageCreateDto,
    ProductSize,
    ProductVariantCreateDto
} from "../../../core/entities";
import {useCreateProduct, useProviders, useUpdateProduct} from "../../hooks/useProviders";

interface ProductFormProps {
    product?: Product;
    providerId?: string;
    mode: 'create' | 'edit';
}

const SIZES: ProductSize[] = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductColor[] = [
    'black', 'white', 'red', 'blue', 'green',
    'yellow', 'pink', 'purple', 'orange', 'brown',
    'gray', 'navy', 'beige'
];

export function ProductForm({ product, providerId, mode }: ProductFormProps) {
    const router = useRouter();
    const { data: providers } = useProviders();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    const [formData, setFormData] = useState<ProductCreateDto>({
        name: product?.name || '',
        description: '',
        basePrice: product?.basePrice || 0,
        categoryId: product?.category?.id || '',
        providerId: providerId || product?.provider?.id || '',
        brandName: product?.brandName || '',
        is360Enabled: product?.is360Enabled || false,
        variants: [],
        images: []
    });

    const [variants, setVariants] = useState<ProductVariantCreateDto[]>([
        {
            size: 'm',
            color: 'black',
            sku: '',
            basePrice: 0,
            priceAdjustment: 0,
            stockQuantity: 0,
            lowStockThreshold: 5,
            isAvailable: true,
            barcode: '',
            weight: 0,
            inStockNo: ''
        }
    ]);

    const [images, setImages] = useState<ProductImageCreateDto[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: keyof ProductCreateDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleVariantChange = (
        index: number,
        field: keyof ProductVariantCreateDto,
        value: any
    ) => {
        setVariants(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addVariant = () => {
        setVariants(prev => [
            ...prev,
            {
                size: 'm',
                color: 'black',
                sku: `SKU-${Date.now()}`,
                basePrice: formData.basePrice,
                priceAdjustment: 0,
                stockQuantity: 0,
                lowStockThreshold: 5,
                isAvailable: true,
                barcode: '',
                weight: 0,
                inStockNo: ''
            }
        ]);
    };

    const removeVariant = (index: number) => {
        if (variants.length > 1) {
            setVariants(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleImageChange = (
        index: number,
        field: keyof ProductImageCreateDto,
        value: any
    ) => {
        setImages(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addImage = () => {
        setImages(prev => [
            ...prev,
            {
                imageUrl: '',
                imageType: 'regular',
                sequenceOrder: images.length,
                isPrimary: images.length === 0,
                associatedColor: 'black'
            }
        ]);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.brandName.trim()) newErrors.brandName = 'Brand name is required';
        if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        if (!formData.providerId) newErrors.providerId = 'Provider is required';
        if (variants.length === 0) newErrors.variants = 'At least one variant is required';

        variants.forEach((variant, index) => {
            if (!variant.sku.trim()) newErrors[`variant-${index}-sku`] = 'SKU is required';
            if (variant.basePrice < 0) newErrors[`variant-${index}-price`] = 'Price cannot be negative';
            if (variant.stockQuantity < 0) newErrors[`variant-${index}-stock`] = 'Stock cannot be negative';
        });

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
            const data: ProductCreateDto = {
                ...formData,
                variants,
                images
            };

            if (mode === 'create') {
                await createProduct.mutateAsync(data);
                alert('Product created successfully!');
                router.push(`/dashboard/providers/${formData.providerId}/products`);
            } else if (product) {
                await updateProduct.mutateAsync({ id: product.id, data });
                alert('Product updated successfully!');
                router.back();
            }
        } catch (error: any) {
            alert(error.message || 'Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter product name"
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brand Name *
                        </label>
                        <input
                            type="text"
                            value={formData.brandName}
                            onChange={(e) => handleInputChange('brandName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.brandName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter brand name"
                        />
                        {errors.brandName && <p className="text-sm text-red-600 mt-1">{errors.brandName}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Base Price ($) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.basePrice}
                            onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.basePrice ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                        />
                        {errors.basePrice && <p className="text-sm text-red-600 mt-1">{errors.basePrice}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Provider *
                        </label>
                        <select
                            value={formData.providerId}
                            onChange={(e) => handleInputChange('providerId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.providerId ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={!!providerId}
                        >
                            <option value="">Select provider</option>
                            {providers?.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.name}
                                </option>
                            ))}
                        </select>
                        {errors.providerId && <p className="text-sm text-red-600 mt-1">{errors.providerId}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category ID *
                        </label>
                        <input
                            type="text"
                            value={formData.categoryId}
                            onChange={(e) => handleInputChange('categoryId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.categoryId ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter category UUID"
                        />
                        {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is360Enabled"
                            checked={formData.is360Enabled}
                            onChange={(e) => handleInputChange('is360Enabled', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="is360Enabled" className="text-sm font-medium text-gray-700">
                            Enable 360° View
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter product description"
                    />
                </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Product Variants</h2>
                    <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Variant
                    </Button>
                </div>

                <div className="space-y-4">
                    {variants.map((variant, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">Variant {index + 1}</h3>
                                {variants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Size *</label>
                                    <select
                                        value={variant.size}
                                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    >
                                        {SIZES.map(size => (
                                            <option key={size} value={size}>{size.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Color *</label>
                                    <select
                                        value={variant.color}
                                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    >
                                        {COLORS.map(color => (
                                            <option key={color} value={color}>{color}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                                    <input
                                        type="text"
                                        value={variant.sku}
                                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                        className={`w-full px-2 py-1.5 text-sm border rounded-lg ${
                                            errors[`variant-${index}-sku`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
                                    <input
                                        type="number"
                                        value={variant.stockQuantity}
                                        onChange={(e) => handleVariantChange(index, 'stockQuantity', parseInt(e.target.value))}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Base Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={variant.basePrice}
                                        onChange={(e) => handleVariantChange(index, 'basePrice', parseFloat(e.target.value))}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Price Adj ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={variant.priceAdjustment}
                                        onChange={(e) => handleVariantChange(index, 'priceAdjustment', parseFloat(e.target.value))}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Barcode</label>
                                    <input
                                        type="text"
                                        value={variant.barcode}
                                        onChange={(e) => handleVariantChange(index, 'barcode', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight (g)</label>
                                    <input
                                        type="number"
                                        value={variant.weight}
                                        onChange={(e) => handleVariantChange(index, 'weight', parseFloat(e.target.value))}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3">
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
                    {mode === 'create' ? 'Create Product' : 'Update Product'}
                </Button>
            </div>
        </form>
    );
}