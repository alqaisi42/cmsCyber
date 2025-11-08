'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';

import {
    Plus, Trash2, Image as ImageIcon, Package,
    DollarSign, Box, Save, AlertCircle
} from 'lucide-react';

import {
    CreateProductRequest,
    CreateVariantRequest,
    CreateImageRequest
} from '../../../core/entities/ecommerce';

import {
    useCategories,
    useProviders,
    useCreateProduct,
    useUploadProductImages
} from '../../hooks/useShop';

import { EnhancedImageUpload, ImageData } from './EnhancedImageUpload';
import { UploadImageMetadata } from '@/infrastructure/services/product-image.service';

// -----------------------------------------------------
// Validation Schema
// -----------------------------------------------------
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
    stockQuantity: z.number().min(0, 'Stock must be positive'),
    lowStockThreshold: z.number().min(0).default(5),
    isAvailable: z.boolean().default(true),
    barcode: z.string().optional(),
    weight: optionalNumberField,
    inStockNo: z.string().optional()
});

const imageSchema = z.object({
    imageUrl: z.string(),
    imageType: z.enum(['regular', 'rotation360', 'thumbnail']),
    sequenceOrder: z.number(),
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
    is360Enabled: z.boolean(),
    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
    images: z.array(imageSchema).min(1, 'At least one image is required')
});

type ProductFormData = z.infer<typeof productSchema>;

// -----------------------------------------------------
// Component
// -----------------------------------------------------
export function EnhancedProductForm({ onSuccess, onCancel, initialProviderId }) {

    const { data: providers } = useProviders();
    const { data: categories } = useCategories(initialProviderId || '');

    const createProduct = useCreateProduct();
    const { uploadProductImages, isUploading } = useUploadProductImages();

    const [regularImages, setRegularImages] = useState<ImageData[]>([]);
    const [rotation360Images, setRotation360Images] = useState<ImageData[]>([]);
    const [selected360Variant, setSelected360Variant] = useState('');

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
            variants: [{
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
            }],
            images: []
        }
    });

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants'
    });

    const is360Enabled = watch('is360Enabled');
    const variants = watch('variants');

    // Unique variant colors
    const variantColors = useMemo(() => {
        const colors = new Set(variants.map(v => v.color).filter(Boolean));
        return [...colors];
    }, [variants]);

    // Combine images into form images
    useEffect(() => {
        const combined = [
            ...regularImages.map(img => ({
                imageUrl: img.url,
                imageType: 'regular' as const,
                sequenceOrder: img.sequenceOrder,
                isPrimary: img.isPrimary,
                associatedColor: img.associatedColor || '',
                variantId: img.variantId || '',
                rotationFrameNumber: undefined
            })),
            ...rotation360Images.map((img, index) => ({
                imageUrl: img.url,
                imageType: 'rotation360' as const,
                sequenceOrder: regularImages.length + img.sequenceOrder,
                isPrimary: false,
                associatedColor: img.associatedColor || selected360Variant || '',
                variantId: img.variantId || '',
                rotationFrameNumber: img.rotationFrameNumber ?? index + 1
            }))
        ];

        setValue('images', combined);
    }, [regularImages, rotation360Images, selected360Variant, setValue]);

    // Show form validation errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            if (firstError?.message) {
                toast.error(firstError.message as string);
            }
        }
    }, [errors]);

    // -----------------------------------------------------
    // Submit
    // -----------------------------------------------------
// -----------------------------------------------------
// Submit
// -----------------------------------------------------
    const onSubmit = async (data: ProductFormData) => {
        try {
            // Validate images
            if (regularImages.length === 0 && rotation360Images.length === 0) {
                toast.error('Please add at least one product image');
                return;
            }

            // Check if at least one image has a file to upload
            const hasFilesToUpload =
                regularImages.some(i => i.file) ||
                rotation360Images.some(i => i.file);

            if (!hasFilesToUpload) {
                toast.error('Please upload at least one image file');
                return;
            }

            toast.loading('Creating product...', { id: 'product-create' });

            // 1. Build product request
            const formatted: CreateProductRequest = {
                name: data.name,
                description: data.description,
                basePrice: data.basePrice,
                categoryId: data.categoryId,
                providerId: data.providerId,
                brandName: data.brandName || undefined,
                is360Enabled: data.is360Enabled,
                variants: data.variants.map(v => ({
                    size: v.size,
                    color: v.color,
                    sku: v.sku,
                    basePrice: v.basePrice,
                    priceAdjustment: v.priceAdjustment,
                    stockQuantity: v.stockQuantity,
                    lowStockThreshold: v.lowStockThreshold,
                    isAvailable: v.isAvailable,
                    barcode: v.barcode || undefined,
                    weight: v.weight,
                    inStockNo: v.inStockNo || undefined
                })),
                images: []
            };

            // 2. Create product
            const created = await createProduct.mutateAsync(formatted);
            if (!created?.id) {
                throw new Error('Product created without ID');
            }
            const productId = created.id;

            toast.loading('Uploading images...', { id: 'product-create' });

            // 3. Build files and metadata with proper frame numbering
            const regularFilesWithMeta = regularImages
                .filter(i => i.file)
                .map((img, index) => ({
                    file: img.file!,
                    metadata: {
                        filename: img.file?.name || 'image.jpg',
                        imageType: 'REGULAR' as const,
                        sequenceOrder: index,
                        isPrimary: img.isPrimary,
                        associatedColor: img.associatedColor || null
                    }
                }));

            const rotation360FilesWithMeta = rotation360Images
                .filter(i => i.file)
                .map((img, index) => ({
                    file: img.file!,
                    metadata: {
                        filename: img.file?.name || 'image.jpg',
                        imageType: 'ROTATION360' as const,
                        sequenceOrder: regularFilesWithMeta.length + index,
                        isPrimary: false,
                        associatedColor: img.associatedColor || selected360Variant || null,
                        rotationFrameNumber: index + 1  // Consecutive: 1, 2, 3, ...
                    }
                }));

            // 4. Combine files and metadata
            const allFilesWithMeta = [...regularFilesWithMeta, ...rotation360FilesWithMeta];

            // ✅ CRITICAL: Ensure only ONE primary image across all types
            // HARD RESET: rotation images must NEVER be primary
            // ✅ Force rotation images to NEVER be primary
            allFilesWithMeta.forEach(item => {
                if (item.metadata.imageType === 'ROTATION360') {
                    item.metadata.isPrimary = false;
                }
            });

// ✅ Enforce exactly one primary for REGULAR images only
            let foundPrimary = false;
            allFilesWithMeta.forEach(item => {
                if (item.metadata.isPrimary && !foundPrimary && item.metadata.imageType === 'REGULAR') {
                    foundPrimary = true;
                } else {
                    item.metadata.isPrimary = false;
                }
            });

// ✅ If no primary, set first regular as primary
            if (!foundPrimary) {
                const firstRegular = allFilesWithMeta.find(f => f.metadata.imageType === 'REGULAR');
                if (firstRegular) {
                    firstRegular.metadata.isPrimary = true;
                }
            }


            const files = allFilesWithMeta.map(f => f.file);
            const metadata: UploadImageMetadata[] = allFilesWithMeta.map(f => f.metadata);

            // 5. Upload files + metadata
            if (files.length > 0) {
                await uploadProductImages({
                    productId,
                    files,
                    metadata
                });
            }

            toast.success('Product created successfully!', { id: 'product-create' });
            onSuccess?.();

        } catch (err: any) {
            console.error('Failed to create product:', err);

            // Parse error message
            let errorMessage = 'Failed to create product';

            if (err?.response?.data?.error) {
                try {
                    const parsedError = JSON.parse(err.response.data.error);
                    if (parsedError.errors && Array.isArray(parsedError.errors)) {
                        errorMessage = parsedError.errors.join(', ');
                    } else if (parsedError.message) {
                        errorMessage = parsedError.message;
                    }
                } catch {
                    errorMessage = err.response.data.error;
                }
            } else if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            toast.error(errorMessage, { id: 'product-create', duration: 5000 });
        }
    };
    // -----------------------------------------------------
    // Render
    // -----------------------------------------------------
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* BASIC INFO */}
            <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" /> Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                    {/* Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('name')}
                            placeholder="e.g., Nike Air Max 270"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('description')}
                            placeholder="Describe the product features, materials, and benefits..."
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('categoryId')}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.categoryId ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select category</option>
                            {categories?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.categoryId && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.categoryId.message}
                            </p>
                        )}
                    </div>

                    {/* Provider */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Provider <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('providerId')}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.providerId ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={!!initialProviderId}
                        >
                            <option value="">Select provider</option>
                            {providers?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {errors.providerId && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.providerId.message}
                            </p>
                        )}
                    </div>

                    {/* Base Price */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Base Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register('basePrice', { valueAsNumber: true })}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.basePrice ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                        </div>
                        {errors.basePrice && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.basePrice.message}
                            </p>
                        )}
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Brand</label>
                        <input
                            {...register('brandName')}
                            placeholder="e.g., Nike, Adidas"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 360 Enable */}
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('is360Enabled')}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium">Enable 360° View</span>
                            <span className="text-gray-500 text-xs">(Upload multiple images for rotation)</span>
                        </label>
                    </div>

                </div>
            </div>

            {/* VARIANTS */}
            <div className="bg-white rounded-xl p-6 border">

                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Box className="w-5 h-5" /> Variants
                        {errors.variants && (
                            <span className="text-red-500 text-xs">
                                ({errors.variants.message})
                            </span>
                        )}
                    </h3>
                    <button
                        type="button"
                        onClick={() => appendVariant({
                            size: '', color: '', sku: '',
                            basePrice: 0, priceAdjustment: 0,
                            stockQuantity: 0, lowStockThreshold: 5,
                            isAvailable: true, barcode: '', weight: undefined,
                            inStockNo: ''
                        })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Variant
                    </button>
                </div>

                {variantFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg mb-4 bg-slate-50">

                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-sm">Variant {index + 1}</h4>
                            {variantFields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeVariant(index)}
                                    className="text-red-600 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                            <div>
                                <label className="text-xs font-medium block mb-1">
                                    Size <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register(`variants.${index}.size`)}
                                    placeholder="e.g., M, L, XL"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                                        errors.variants?.[index]?.size ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">
                                    Color <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register(`variants.${index}.color`)}
                                    placeholder="e.g., Black, White"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                                        errors.variants?.[index]?.color ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">
                                    SKU <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register(`variants.${index}.sku`)}
                                    placeholder="e.g., NIKE-AM270-BLK-M"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                                        errors.variants?.[index]?.sku ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">
                                    Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register(`variants.${index}.basePrice`, { valueAsNumber: true })}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                                        errors.variants?.[index]?.basePrice ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    {...register(`variants.${index}.stockQuantity`, { valueAsNumber: true })}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                                        errors.variants?.[index]?.stockQuantity ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">Weight (grams)</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 500"
                                    {...register(`variants.${index}.weight`, { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">Barcode</label>
                                <input
                                    {...register(`variants.${index}.barcode`)}
                                    placeholder="e.g., 1234567890123"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">Stock No.</label>
                                <input
                                    {...register(`variants.${index}.inStockNo`)}
                                    placeholder="e.g., WH-001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium block mb-1">Low Stock Alert</label>
                                <input
                                    type="number"
                                    placeholder="5"
                                    {...register(`variants.${index}.lowStockThreshold`, { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* IMAGES */}
            <div className="bg-white rounded-xl p-6 border">

                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Product Images
                    {errors.images && (
                        <span className="text-red-500 text-xs">
                            ({errors.images.message})
                        </span>
                    )}
                </h3>

                <div className="mb-2">
                    <p className="text-sm text-gray-600">Upload regular product images</p>
                </div>

                <EnhancedImageUpload
                    onImagesChange={setRegularImages}
                    initialImages={regularImages}
                    imageType="regular"
                    maxFiles={20}
                    allowUrlInput
                />

                {is360Enabled && (
                    <div className="mt-6 border-t pt-6">

                        <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> 360° Rotation Images
                        </h4>

                        {variantColors.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">
                                    Associate 360° with color (optional)
                                </label>
                                <select
                                    value={selected360Variant}
                                    onChange={(e) => setSelected360Variant(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None - General 360° view</option>
                                    {variantColors.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Link these 360° images to a specific color variant
                                </p>
                            </div>
                        )}

                        <div className="mb-2">
                            <p className="text-sm text-gray-600">
                                Upload images in sequence (frame 1, 2, 3...) for 360° rotation effect
                            </p>
                        </div>

                        <EnhancedImageUpload
                            onImagesChange={setRotation360Images}
                            initialImages={rotation360Images}
                            imageType="rotation360"
                            associatedColor={selected360Variant}
                            maxFiles={100}
                            allowUrlInput
                        />
                    </div>
                )}

            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-4 sticky bottom-0 bg-white p-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={createProduct.isPending || isUploading}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={createProduct.isPending || isUploading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {createProduct.isPending || isUploading ? 'Creating...' : 'Create Product'}
                </button>
            </div>

        </form>
    );
}