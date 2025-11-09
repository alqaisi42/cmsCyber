'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    Save,
    UploadCloud,
} from 'lucide-react';

import type { ShopProductDetail } from '@/core/entities/ecommerce';
import type { ProductImage } from '@/infrastructure/services/product-image.service';
import { useCategories, useUpdateProduct, useUploadProductImages } from '@/presentation/hooks/useShop';
import { EnhancedImageUpload, ImageData } from './EnhancedImageUpload';
import type { UploadImageMetadata } from '@/infrastructure/services/product-image.service';

const updateSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    basePrice: z.number().min(0, 'Base price must be zero or higher'),
    categoryId: z.string().min(1, 'Category is required'),
    brandName: z.string().optional(),
    is360Enabled: z.boolean(),
    isActive: z.boolean(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

type ProductUpdateFormProps = {
    product: ShopProductDetail;
    images: ProductImage[];
    onSuccess?: () => void;
    onCancel?: () => void;
};

export function ProductUpdateForm({ product, images, onSuccess, onCancel }: ProductUpdateFormProps) {
    const providerId = product.provider?.id ?? product.providerId;
    const { data: categories, isLoading: loadingCategories } = useCategories(providerId ?? '');
    const updateProduct = useUpdateProduct();
    const { uploadProductImages, isUploading } = useUploadProductImages();

    const [additionalRegularImages, setAdditionalRegularImages] = useState<ImageData[]>([]);
    const [additionalRotationImages, setAdditionalRotationImages] = useState<ImageData[]>([]);

    const existingImages = useMemo(() => images ?? [], [images]);
    const existingRotationImages = useMemo(
        () => existingImages.filter((img) => img.imageType === '360' || img.imageType === 'rotation360'),
        [existingImages]
    );

    const nextSequenceStart = useMemo(() => {
        if (!existingImages.length) {
            return 0;
        }
        return (
            existingImages.reduce((max, image) => {
                if (typeof image.sequenceOrder === 'number') {
                    return Math.max(max, image.sequenceOrder);
                }
                return max;
            }, -1) + 1
        );
    }, [existingImages]);

    const nextRotationFrameStart = useMemo(() => {
        if (!existingRotationImages.length) {
            return 1;
        }
        return (
            existingRotationImages.reduce((max, image) => {
                if (typeof image.rotationFrameNumber === 'number') {
                    return Math.max(max, image.rotationFrameNumber);
                }
                return max;
            }, 0) + 1
        );
    }, [existingRotationImages]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UpdateFormValues>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            name: product.name,
            description: product.description,
            basePrice: product.basePrice ?? 0,
            categoryId: product.categoryId,
            brandName: product.brandName ?? '',
            is360Enabled: product.is360Enabled,
            isActive: product.isActive,
        },
    });

    useEffect(() => {
        reset({
            name: product.name,
            description: product.description,
            basePrice: product.basePrice ?? 0,
            categoryId: product.categoryId,
            brandName: product.brandName ?? '',
            is360Enabled: product.is360Enabled,
            isActive: product.isActive,
        });
    }, [product, reset]);

    const onSubmit = async (values: UpdateFormValues) => {
        try {
            toast.loading('Updating product...', { id: 'product-update' });

            await updateProduct.mutateAsync({
                id: product.id,
                data: {
                    name: values.name,
                    description: values.description,
                    basePrice: values.basePrice,
                    categoryId: values.categoryId,
                    brandName: values.brandName || undefined,
                    is360Enabled: values.is360Enabled,
                    isActive: values.isActive,
                },
            });

            const files: File[] = [];
            const metadata: UploadImageMetadata[] = [];

            let sequenceCursor = nextSequenceStart;
            let rotationFrameCursor = nextRotationFrameStart;

            additionalRegularImages
                .filter((image) => Boolean(image.file))
                .forEach((image, index) => {
                    const file = image.file!;
                    files.push(file);
                    metadata.push({
                        filename: file.name ?? `regular-${index + 1}.jpg`,
                        imageType: 'REGULAR',
                        sequenceOrder: sequenceCursor++,
                        isPrimary: false,
                        associatedColor: image.associatedColor,
                        variantId: image.variantId,
                    });
                });

            additionalRotationImages
                .filter((image) => Boolean(image.file))
                .forEach((image, index) => {
                    const file = image.file!;
                    files.push(file);
                    metadata.push({
                        filename: file.name ?? `rotation-${index + 1}.jpg`,
                        imageType: 'ROTATION360',
                        sequenceOrder: sequenceCursor++,
                        isPrimary: false,
                        associatedColor: image.associatedColor,
                        variantId: image.variantId,
                        rotationFrameNumber: rotationFrameCursor++,
                    });
                });

            if (files.length > 0) {
                toast.loading('Uploading new images...', { id: 'product-update-images' });
                await uploadProductImages({
                    productId: product.id,
                    files,
                    metadata,
                });
                toast.dismiss('product-update-images');
            }

            toast.success('Product updated successfully', { id: 'product-update' });
            onSuccess?.();
        } catch (error: any) {
            console.error('Failed to update product:', error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Unable to update product. Please try again later.';
            toast.error(message, { id: 'product-update' });
        }
    };

    const disableSubmit = isSubmitting || updateProduct.isPending || isUploading;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Save className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Product information</h2>
                        <p className="text-sm text-slate-600">Update the core details for this product.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('name')}
                            type="text"
                            className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.name ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="Product name"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.description ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="Describe product features, materials, and benefits"
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Base Price <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('basePrice', { valueAsNumber: true })}
                            type="number"
                            step="0.01"
                            min={0}
                            className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.basePrice ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="0.00"
                        />
                        {errors.basePrice && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.basePrice.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('categoryId')}
                            className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.categoryId ? 'border-red-500' : 'border-slate-300'
                            }`}
                            disabled={loadingCategories || !categories?.length}
                        >
                            <option value="">Select a category</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.categoryId && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.categoryId.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Brand</label>
                        <input
                            {...register('brandName')}
                            type="text"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional brand name"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                        <input
                            id="isActive"
                            type="checkbox"
                            {...register('isActive')}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                            Product is active
                        </label>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                        <input
                            id="is360Enabled"
                            type="checkbox"
                            {...register('is360Enabled')}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is360Enabled" className="text-sm font-medium text-slate-700">
                            Enable 360° viewer
                        </label>
                    </div>
                </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Existing media overview</h2>
                        <p className="text-sm text-slate-600">
                            {existingImages.length} images total · {existingRotationImages.length} rotation frames currently stored
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                        <p className="font-semibold text-slate-900">Primary image</p>
                        <p>{existingImages.find((img) => img.isPrimary)?.imageUrl ? 'Configured' : 'Not set'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                        <p className="font-semibold text-slate-900">Gallery images</p>
                        <p>{existingImages.filter((img) => img.imageType === 'regular').length}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                        <p className="font-semibold text-slate-900">360° frames</p>
                        <p>{existingRotationImages.length}</p>
                    </div>
                </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <UploadCloud className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Add additional gallery images</h2>
                        <p className="text-sm text-slate-600">New images will be appended to the end of the gallery sequence.</p>
                    </div>
                </div>
                <EnhancedImageUpload
                    onImagesChange={setAdditionalRegularImages}
                    initialImages={[]}
                    allowUrlInput={false}
                    imageType="regular"
                />
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Add additional 360° frames</h2>
                        <p className="text-sm text-slate-600">
                            Frames start at {nextRotationFrameStart} to maintain your existing rotation order.
                        </p>
                    </div>
                </div>
                <EnhancedImageUpload
                    onImagesChange={setAdditionalRotationImages}
                    initialImages={[]}
                    allowUrlInput={false}
                    imageType="rotation360"
                />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={disableSubmit}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                    {(isSubmitting || updateProduct.isPending || isUploading) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Save changes
                </button>
            </div>
        </form>
    );
}
