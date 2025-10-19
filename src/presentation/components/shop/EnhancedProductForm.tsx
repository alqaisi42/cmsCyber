// src/presentation/components/shop/EnhancedProductForm.tsx
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect } from 'react';
import {
    Plus, Trash2, Image as ImageIcon, Package, DollarSign,
    Tag, Box, Palette, Ruler, RotateCw, Save, X
} from 'lucide-react';
import { CreateProductRequest, CreateVariantRequest, CreateImageRequest } from '../../../core/entities/ecommerce';
import { useCategories, useProviders, useCreateProduct } from '../../hooks/useShop';
import { EnhancedImageUpload, ImageData } from './EnhancedImageUpload';

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

interface EnhancedProductFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialProviderId?: string;
}

export function EnhancedProductForm({ onSuccess, onCancel, initialProviderId }: EnhancedProductFormProps) {
    const { data: categories } = useCategories();
    const { data: providers } = useProviders();
    const createProduct = useCreateProduct();
    const [selected360Variant, setSelected360Variant] = useState<string>('');
    const [regularImages, setRegularImages] = useState<ImageData[]>([]);
    const [rotation360Images, setRotation360Images] = useState<ImageData[]>([]);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
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
            images: []
        }
    });

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants'
    });

    const is360Enabled = watch('is360Enabled');
    const variants = watch('variants');
    const formImages = watch('images');

    // Get unique colors from variants for 360 association
    const variantColors = useMemo(() => {
        const colors = new Set(variants.map(v => v.color).filter(Boolean));
        return Array.from(colors);
    }, [variants]);

    // Update form images when regular or 360 images change
    useEffect(() => {
        const allImages = [
            ...regularImages.map((img): z.infer<typeof imageSchema> => ({
                imageUrl: img.url,
                imageType: img.imageType as 'regular' | 'thumbnail',
                sequenceOrder: img.sequenceOrder,
                isPrimary: img.isPrimary,
                associatedColor: img.associatedColor || '',
                variantId: img.variantId || '',
                rotationFrameNumber: undefined
            })),
            ...rotation360Images.map((img): z.infer<typeof imageSchema> => ({
                imageUrl: img.url,
                imageType: 'rotation360' as const,
                sequenceOrder: regularImages.length + img.sequenceOrder,
                isPrimary: img.isPrimary && regularImages.length === 0,
                associatedColor: img.associatedColor || selected360Variant || '',
                variantId: img.variantId || '',
                rotationFrameNumber: img.rotationFrameNumber
            }))
        ];

        setValue('images', allImages);
    }, [regularImages, rotation360Images, selected360Variant, setValue]);

    // Handle regular images change
    const handleRegularImagesChange = (images: ImageData[]) => {
        setRegularImages(images);
    };

    // Handle 360 images change
    const handle360ImagesChange = (images: ImageData[]) => {
        setRotation360Images(images);
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            const formattedData: CreateProductRequest = {
                name: data.name,
                description: data.description,
                basePrice: data.basePrice,
                categoryId: data.categoryId.trim(),
                providerId: data.providerId.trim(),
                brandName: data.brandName?.trim() || undefined,
                is360Enabled: data.is360Enabled,
                variants: data.variants.map((variant): CreateVariantRequest => ({
                    size: variant.size,
                    color: variant.color,
                    sku: variant.sku,
                    basePrice: variant.basePrice,
                    priceAdjustment: variant.priceAdjustment,
                    stockQuantity: variant.stockQuantity,
                    lowStockThreshold: variant.lowStockThreshold,
                    isAvailable: variant.isAvailable,
                    barcode: variant.barcode?.trim() || undefined,
                    weight: typeof variant.weight === 'number' && !Number.isNaN(variant.weight)
                        ? variant.weight : undefined,
                    inStockNo: variant.inStockNo?.trim() || undefined,
                })),
                images: data.images.map((image, index): CreateImageRequest => ({
                    imageUrl: image.imageUrl,
                    imageType: image.imageType === '360' ? 'rotation360' : image.imageType,
                    sequenceOrder: typeof image.sequenceOrder === 'number' ? image.sequenceOrder : index,
                    isPrimary: image.isPrimary,
                    associatedColor: image.associatedColor?.trim() || undefined,
                    variantId: image.variantId?.trim() || undefined,
                    rotationFrameNumber: typeof image.rotationFrameNumber === 'number'
                        ? image.rotationFrameNumber : undefined,
                })),
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
                            Category *
                        </label>
                        <select
                            {...register('categoryId')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select category</option>
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
                            Provider *
                        </label>
                        <select
                            {...register('providerId')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            disabled={!!initialProviderId}
                        >
                            <option value="">Select provider</option>
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
                            Base Price *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
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
                            basePrice: 0,
                            priceAdjustment: 0,
                            stockQuantity: 0,
                            lowStockThreshold: 5,
                            isAvailable: true,
                            barcode: '',
                            weight: undefined,
                            inStockNo: ''
                        })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Variant
                    </button>
                </div>

                <div className="space-y-4">
                    {variantFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-slate-700">
                                    Variant {index + 1}
                                </h4>
                                {variantFields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Size *
                                    </label>
                                    <input
                                        {...register(`variants.${index}.size`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., M, L, XL"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Color *
                                    </label>
                                    <input
                                        {...register(`variants.${index}.color`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., Red, Blue"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        SKU *
                                    </label>
                                    <input
                                        {...register(`variants.${index}.sku`)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="ABC123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Variant Price *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`variants.${index}.basePrice`, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
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
                                        Weight (g)
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`variants.${index}.weight`, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Images Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Product Images
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Upload and arrange your product images. Drag to reorder.
                    </p>
                </div>

                {/* Regular Images */}
                <div className="mb-6">
                    <EnhancedImageUpload
                        onImagesChange={handleRegularImagesChange}
                        initialImages={regularImages}
                        imageType="regular"
                        maxFiles={20}
                        maxFileSize={5}
                        allowUrlInput={true}
                        allowCaptions={true}
                    />
                </div>

                {/* 360° Images Section - Only show if enabled */}
                {is360Enabled && (
                    <div className="pt-6 border-t border-slate-200">
                        {variantColors.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Associate 360° images with variant color (optional)
                                </label>
                                <select
                                    value={selected360Variant}
                                    onChange={(e) => setSelected360Variant(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">No specific color</option>
                                    {variantColors.map((color) => (
                                        <option key={color} value={color}>
                                            {color}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <EnhancedImageUpload
                            onImagesChange={handle360ImagesChange}
                            initialImages={rotation360Images}
                            imageType="rotation360"
                            associatedColor={selected360Variant}
                            maxFiles={100}
                            maxFileSize={5}
                            allowUrlInput={true}
                            allowCaptions={false}
                        />
                    </div>
                )}

                {/* Display validation error for images */}
                {errors.images && (
                    <p className="text-red-600 text-sm mt-2">{errors.images.message}</p>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={createProduct.isPending }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {createProduct.isPending  ? 'Creating...' : 'Create Product'}
                </button>
            </div>
        </form>
    );
}