// src/presentation/components/shop/ProductForm.tsx
// NEW - Comprehensive Product Form with Variants

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus, Trash2, Image as ImageIcon, Package, DollarSign,
    Tag, Box, Palette, Ruler
} from 'lucide-react';
import { CreateProductRequest } from '../../../core/entities/ecommerce';
import { useCategories, useProviders, useCreateProduct } from '../../hooks/useShop';

// Validation Schema
const optionalNumberField = z
    .union([z.number(), z.nan()])
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .optional();

const variantSchema = z.object({
    size: z.string().min(1, 'Size is required'),
    color: z.string().min(1, 'Color is required'),
    sku: z.string().min(1, 'SKU is required'),
    basePrice: z.number().min(0, 'Price must be positive'),
    priceAdjustment: z.number().default(0),
    stockQuantity: z.number().min(0, 'Stock must be non-negative'),
    lowStockThreshold: z.number().min(0, 'Low stock threshold must be non-negative').default(5),
    isAvailable: z.boolean().default(true),
    barcode: z.string().optional(),
    weight: optionalNumberField,
    inStockNo: z.string().optional()
});

const imageSchema = z.object({
    imageUrl: z.string().url('Invalid URL'),
    imageType: z.enum(['regular', 'rotation360', '360', 'thumbnail']),
    sequenceOrder: z.number().min(0, 'Sequence order must be zero or greater'),
    isPrimary: z.boolean(),
    associatedColor: z.string().optional(),
    variantId: z.string().optional(),
    rotationFrameNumber: optionalNumberField,
});

const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    basePrice: z.number().min(0, 'Price must be positive'),
    categoryId: z.string().min(1, 'Category is required'),
    providerId: z.string().min(1, 'Provider is required'),
    brandName: z.string().optional(),
    is360Enabled: z.boolean().default(false),
    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
    images: z.array(imageSchema).min(1, 'At least one image is required')
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialProviderId?: string;
}

export function ProductForm({ onSuccess, onCancel, initialProviderId }: ProductFormProps) {
    const { data: categories } = useCategories();
    const { data: providers } = useProviders();
    const createProduct = useCreateProduct();

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            providerId: initialProviderId || '',
            basePrice: 0,
            is360Enabled: false,
            variants: [
                {
                    size: '',
                    color: '',
                    sku: '',
                    basePrice: 0,
                    priceAdjustment: 0,
                    stockQuantity: 0,
                    lowStockThreshold: 5,
                    isAvailable: true,
                    barcode: '',
                    weight: undefined,
                    inStockNo: ''
                }
            ],
            images: [
                {
                    imageUrl: '',
                    imageType: 'regular',
                    sequenceOrder: 1,
                    isPrimary: true,
                    associatedColor: '',
                    variantId: '',
                    rotationFrameNumber: undefined
                }
            ]
        }
    });

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants'
    });

    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
        control,
        name: 'images'
    });

    const onSubmit = async (data: ProductFormData) => {
        try {
            const formattedData: CreateProductRequest = {
                ...data,
                providerId: data.providerId.trim(),
                categoryId: data.categoryId.trim(),
                brandName: data.brandName?.trim() || undefined,
                variants: data.variants.map((variant) => ({
                    ...variant,
                    barcode: variant.barcode?.trim() ? variant.barcode.trim() : undefined,
                    inStockNo: variant.inStockNo?.trim() ? variant.inStockNo.trim() : undefined,
                    weight:
                        typeof variant.weight === 'number' && !Number.isNaN(variant.weight)
                            ? variant.weight
                            : undefined,
                })),
                images: data.images.map((image, index) => {
                    const normalizedType = image.imageType === '360' ? 'rotation360' : image.imageType;

                    const rotationFrame =
                        typeof image.rotationFrameNumber === 'number' && !Number.isNaN(image.rotationFrameNumber)
                            ? image.rotationFrameNumber
                            : undefined;

                    return {
                        ...image,
                        imageType: normalizedType,
                        sequenceOrder:
                            typeof image.sequenceOrder === 'number' && !Number.isNaN(image.sequenceOrder)
                                ? image.sequenceOrder
                                : index + 1,
                        associatedColor: image.associatedColor?.trim() ? image.associatedColor.trim() : undefined,
                        variantId: image.variantId?.trim() ? image.variantId.trim() : undefined,
                        rotationFrameNumber: rotationFrame,
                    };
                }),
            };

            await createProduct.mutateAsync(formattedData);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create product:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Product Name *
                        </label>
                        <input
                            {...register('name')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Air Jordan 1"
                        />
                        {errors.name && (
                            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Detailed product description..."
                        />
                        {errors.description && (
                            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Provider *
                        </label>
                        <select
                            {...register('providerId')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Provider</option>
                            {providers?.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.name}
                                </option>
                            ))}
                        </select>
                        {errors.providerId && (
                            <p className="text-red-600 text-sm mt-1">{errors.providerId.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Category *
                        </label>
                        <select
                            {...register('categoryId')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Category</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.categoryId && (
                            <p className="text-red-600 text-sm mt-1">{errors.categoryId.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Base Price *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="number"
                                step="0.01"
                                {...register('basePrice', { valueAsNumber: true })}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.basePrice && (
                            <p className="text-red-600 text-sm mt-1">{errors.basePrice.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Brand Name
                        </label>
                        <input
                            {...register('brandName')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Nike"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                {...register('is360Enabled')}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Enable 360° View
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Variants Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Box className="w-5 h-5" />
                        Product Variants
                    </h3>
                    <button
                        type="button"
                        onClick={() => appendVariant({
                            size: '',
                            color: '',
                            sku: '',
                            basePrice: watch('basePrice') || 0,
                    priceAdjustment: 0,
                    stockQuantity: 0,
                    lowStockThreshold: 5,
                    isAvailable: true,
                    barcode: '',
                    weight: undefined,
                    inStockNo: ''
                })}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
                <Plus className="w-4 h-4" />
                Add Variant
                    </button>
                </div>

                <div className="space-y-4">
                    {variantFields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-slate-900">Variant #{index + 1}</h4>
                            {index > 0 && (
                                <button
                                    type="button"
                                        onClick={() => removeVariant(index)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        <Ruler className="w-3 h-3 inline mr-1" />
                                        Size *
                                    </label>
                                    <input
                                        {...register(`variants.${index}.size`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., 42, L, XL"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        <Palette className="w-3 h-3 inline mr-1" />
                                        Color *
                                    </label>
                                    <input
                                        {...register(`variants.${index}.color`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., Black, White"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        SKU *
                                    </label>
                                    <input
                                        {...register(`variants.${index}.sku`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="SKU-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Base Price *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register(`variants.${index}.basePrice`, { valueAsNumber: true })}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`variants.${index}.stockQuantity`, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Price Adjustment
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`variants.${index}.priceAdjustment`, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Barcode
                                    </label>
                                    <input
                                        {...register(`variants.${index}.barcode`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="123456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Low Stock Threshold
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`variants.${index}.lowStockThreshold`, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Weight (g)
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`variants.${index}.weight`, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Inventory Ref.
                                    </label>
                                    <input
                                        {...register(`variants.${index}.inStockNo`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., WH-A-001"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        {...register(`variants.${index}.isAvailable`)}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                                    />
                                    Available for sale
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Images Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Product Images
                    </h3>
                    <button
                        type="button"
                        onClick={() => appendImage({
                            imageUrl: '',
                            imageType: 'regular',
                            sequenceOrder: imageFields.length + 1,
                            isPrimary: false,
                            associatedColor: '',
                            variantId: '',
                            rotationFrameNumber: undefined
                        })}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Image
                    </button>
                </div>

                <div className="space-y-3">
                    {imageFields.map((field, index) => {
                        const imageType = watch(`images.${index}.imageType`);

                        return (
                            <div key={field.id} className="border border-slate-200 rounded-lg p-3 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div className="md:col-span-2">
                                        <input
                                            {...register(`images.${index}.imageUrl`)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <select
                                        {...register(`images.${index}.imageType`)}
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="regular">Regular</option>
                                        <option value="rotation360">360° Rotation</option>
                                        <option value="360">360° (legacy)</option>
                                        <option value="thumbnail">Thumbnail</option>
                                    </select>
                                    <input
                                        type="number"
                                        {...register(`images.${index}.sequenceOrder`, { valueAsNumber: true })}
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Order"
                                    />
                                    <input
                                        {...register(`images.${index}.associatedColor`)}
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Color tag"
                                    />
                                    <input
                                        {...register(`images.${index}.variantId`)}
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Variant ID"
                                    />
                                </div>

                                {imageType === 'rotation360' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                                        <div>
                                            <input
                                                type="number"
                                                {...register(`images.${index}.rotationFrameNumber`, { valueAsNumber: true })}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Frame number"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Frame numbers ensure the 360° viewer keeps images in the correct rotation order.
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            {...register(`images.${index}.isPrimary`)}
                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                                        />
                                        Primary image
                                    </label>

                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={createProduct.isPending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {createProduct.isPending ? 'Creating...' : 'Create Product'}
                </button>
            </div>
        </form>
    );
}