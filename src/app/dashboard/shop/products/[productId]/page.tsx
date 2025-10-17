'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Boxes,
    Building2,
    CheckCircle2,
    Layers,
    Palette,
    Package,
    RotateCw,
    Ruler,
    Tag,
    XCircle,
} from 'lucide-react';
import {useProductDetails} from "../../../../../presentation/hooks/useProductDetails";
import {ProductImage} from "../../../../../infrastructure/services/product-image.service";
import {collectVariantMedia} from "../../../../../presentation/utils/variantMedia";
import {Image360Viewer} from "../../../../../presentation/components/shop/Image360Viewer";


function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }
    return `$${value.toFixed(2)}`;
}

function uniqueSorted(values: Array<string | null | undefined>) {
    const cleaned = values
        .map((value) => (value ?? '').trim())
        .filter((value): value is string => value.length > 0);

    return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
}

export default function ProviderProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const { product, variants, images, groupedImages, isLoading, error } = useProductDetails(productId);

    const availableColors = useMemo(() => uniqueSorted(variants.map((variant) => variant.color)), [variants]);
    const availableSizes = useMemo(() => uniqueSorted(variants.map((variant) => variant.size)), [variants]);

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    useEffect(() => {
        if (availableColors.length === 0) {
            setSelectedColor(null);
            return;
        }

        if (!selectedColor || !availableColors.includes(selectedColor)) {
            setSelectedColor(availableColors[0]);
        }
    }, [availableColors, selectedColor]);

    useEffect(() => {
        if (availableSizes.length === 0) {
            setSelectedSize(null);
            return;
        }

        if (!selectedSize || !availableSizes.includes(selectedSize)) {
            setSelectedSize(availableSizes[0]);
        }
    }, [availableSizes, selectedSize]);

    const selectedVariant = useMemo(() => {
        if (!variants.length) {
            return null;
        }

        const match = variants.find((variant) => {
            const colorMatch = selectedColor ? variant.color === selectedColor : true;
            const sizeMatch = selectedSize ? variant.size === selectedSize : true;
            return colorMatch && sizeMatch;
        });

        return match ?? variants[0];
    }, [variants, selectedColor, selectedSize]);

    const selectedVariantMedia = useMemo(() => {
        if (!selectedVariant) {
            return { allImages: [] as ProductImage[], rotationImages: [] as ProductImage[], total: 0, has360: false };
        }
        return collectVariantMedia(selectedVariant);
    }, [selectedVariant]);

    const rotationImages = useMemo(() => {
        if (selectedVariantMedia.rotationImages.length > 0) {
            return selectedVariantMedia.rotationImages;
        }
        if (groupedImages?.all360?.length) {
            return groupedImages.all360;
        }
        return [] as ProductImage[];
    }, [selectedVariantMedia.rotationImages, groupedImages?.all360]);

    const galleryImages = useMemo(() => {
        const variantGallery = selectedVariantMedia.allImages.filter(
            (image) => !['360', 'rotation360'].includes(image.imageType as string)
        );

        if (variantGallery.length > 0) return variantGallery;
        if (groupedImages?.allRegular?.length) return groupedImages.allRegular;
        if (images.length > 0)
            return images.filter(
                (image) => !['360', 'rotation360'].includes(image.imageType as string)
            );

        return [] as ProductImage[];
    }, [selectedVariantMedia.allImages, groupedImages?.allRegular, images]);

    const heroImageUrl = useMemo(() => {
        const primaryVariantImage = selectedVariantMedia.allImages.find((image) => image.isPrimary)?.imageUrl;
        if (primaryVariantImage) {
            return primaryVariantImage;
        }
        if (galleryImages.length > 0) {
            return galleryImages[0].imageUrl;
        }
        if (groupedImages?.primary?.imageUrl) {
            return groupedImages.primary.imageUrl;
        }
        const firstImage = images[0]?.imageUrl;
        return firstImage ?? null;
    }, [selectedVariantMedia.allImages, galleryImages, groupedImages?.primary, images]);

    const variantPrice = useMemo(() => {
        if (!selectedVariant) {
            return product?.basePrice ?? 0;
        }
        const adjustment = selectedVariant.priceAdjustment ?? 0;
        return selectedVariant.basePrice + adjustment;
    }, [selectedVariant, product?.basePrice]);

    const lowStockCount = useMemo(
        () =>
            variants.filter(
                (variant) => variant.stockQuantity > 0 && variant.lowStockThreshold !== undefined && variant.stockQuantity <= variant.lowStockThreshold
            ).length,
        [variants]
    );

    const outOfStockCount = useMemo(
        () => variants.filter((variant) => variant.stockQuantity <= 0).length,
        [variants]
    );

    const totalStock = useMemo(
        () => variants.reduce((total, variant) => total + (variant.stockQuantity ?? 0), 0),
        [variants]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Unable to load product</h2>
                    <p className="text-red-700 text-sm mb-4">
                        {error instanceof Error ? error.message : 'The product details could not be retrieved at this time.'}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const categoryTrail = product.categoryBreadcrumb ?? [];
    const provider = product.provider;

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to products
                </button>
                <span className="text-xs font-medium text-slate-500">Product ID: {productId}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {rotationImages.length > 0 ? (
                            <Image360Viewer images={rotationImages} className="h-full" autoPlay autoPlaySpeed={120} />
                        ) : (
                            <div className="aspect-square bg-slate-100 flex items-center justify-center">
                                {heroImageUrl ? (
                                    <img src={heroImageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-20 h-20 text-slate-400" />
                                )}
                            </div>
                        )}
                        <div className="p-4 bg-slate-900 text-slate-100 text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <RotateCw className="w-4 h-4" />
                                {rotationImages.length > 0 ? '360° media ready' : '360° assets not available'}
                            </span>
                            <span className="text-xs text-slate-400">
                                {selectedVariantMedia.total > 0 ? `${selectedVariantMedia.total} media asset${selectedVariantMedia.total === 1 ? '' : 's'}` : 'No variant media'}
                            </span>
                        </div>
                    </div>

                    {galleryImages.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Gallery</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {galleryImages.slice(0, 8).map((image) => (
                                    <div key={image.id} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img src={image.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
                                    {product.brandName && (
                                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                            <Tag className="w-4 h-4" />
                                            {product.brandName}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Base price</p>
                                    <p className="text-2xl font-semibold text-blue-600">{formatCurrency(product.basePrice)}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                                    <Layers className="w-4 h-4" />
                                    Variants
                                </div>
                                <p className="text-2xl font-bold text-blue-900 mt-2">{variants.length}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                                    <Boxes className="w-4 h-4" />
                                    Total stock
                                </div>
                                <p className="text-2xl font-bold text-emerald-900 mt-2">{totalStock}</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    Low / Out of stock
                                </div>
                                <p className="text-lg font-semibold text-amber-900 mt-2">
                                    {lowStockCount} low · {outOfStockCount} out
                                </p>
                            </div>
                        </div>

                        {availableColors.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Available colours
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableColors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`px-3 py-1.5 rounded-full border text-sm transition ${
                                                selectedColor === color
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableSizes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Ruler className="w-4 h-4" />
                                    Available sizes
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableSizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                                                selectedSize === size
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            {size.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Selected variant</p>
                                    <p className="text-lg font-semibold text-slate-900 mt-1">
                                        {selectedVariant ? `${selectedVariant.color} · ${selectedVariant.size.toUpperCase()}` : 'No variant selected'}
                                    </p>
                                    {selectedVariant && (
                                        <p className="text-xs text-slate-500 mt-1">SKU: {selectedVariant.sku}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Variant price</p>
                                    <p className="text-2xl font-semibold text-blue-600">{formatCurrency(variantPrice)}</p>
                                    {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
                                        <p className="text-xs text-slate-500">
                                            Includes {selectedVariant.priceAdjustment > 0 ? 'an increase' : 'a discount'} of {formatCurrency(Math.abs(selectedVariant.priceAdjustment))}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {selectedVariant && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Stock</p>
                                        <p className="font-medium text-slate-900">{selectedVariant.stockQuantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Low stock at</p>
                                        <p className="font-medium text-slate-900">{selectedVariant.lowStockThreshold}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Availability</p>
                                        <span className={`inline-flex items-center gap-1 font-medium ${
                                            selectedVariant.isAvailable ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            {selectedVariant.isAvailable ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" /> Available
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4" /> Unavailable
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Barcode</p>
                                        <p className="font-medium text-slate-900">{selectedVariant.barcode ?? '—'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {provider && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Provider
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                    {provider.logoUrl ? (
                                        <img src={provider.logoUrl} alt={provider.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{provider.name}</p>
                                    <p className="text-sm text-slate-600">Rating: {provider.rating ?? '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {categoryTrail.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Category trail</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                {categoryTrail.map((item, index) => (
                                    <span key={item.id} className="flex items-center gap-2">
                                        <span>{item.name}</span>
                                        {index < categoryTrail.length - 1 && <span className="text-slate-400">/</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Variant inventory</h2>
                    <p className="text-sm text-slate-500">Monitor stock, pricing, and availability across all variants.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wide">
                            <tr>
                                <th className="px-4 py-3 text-left">SKU</th>
                                <th className="px-4 py-3 text-left">Colour</th>
                                <th className="px-4 py-3 text-left">Size</th>
                                <th className="px-4 py-3 text-left">Price</th>
                                <th className="px-4 py-3 text-left">Adjustment</th>
                                <th className="px-4 py-3 text-left">Stock</th>
                                <th className="px-4 py-3 text-left">Low stock</th>
                                <th className="px-4 py-3 text-left">Barcode</th>
                                <th className="px-4 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((variant) => {
                                const priceWithAdjustment = variant.basePrice + (variant.priceAdjustment ?? 0);
                                const isLow = variant.lowStockThreshold !== undefined && variant.stockQuantity <= variant.lowStockThreshold;
                                const isOut = variant.stockQuantity <= 0;

                                return (
                                    <tr key={variant.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-medium text-slate-900">{variant.sku}</td>
                                        <td className="px-4 py-3 text-slate-700">{variant.color}</td>
                                        <td className="px-4 py-3 text-slate-700">{variant.size.toUpperCase()}</td>
                                        <td className="px-4 py-3 text-slate-700">{formatCurrency(priceWithAdjustment)}</td>
                                        <td className="px-4 py-3 text-slate-700">{formatCurrency(variant.priceAdjustment)}</td>
                                        <td className="px-4 py-3 text-slate-700">{variant.stockQuantity}</td>
                                        <td className="px-4 py-3 text-slate-700">{variant.lowStockThreshold}</td>
                                        <td className="px-4 py-3 text-slate-700">{variant.barcode ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    isOut
                                                        ? 'bg-red-100 text-red-700'
                                                        : isLow
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {variant.isAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
