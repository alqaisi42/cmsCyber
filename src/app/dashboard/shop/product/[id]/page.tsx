'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Star,
    Package,
    ShoppingCart,
    Heart,
    Share2,
    Store,
    Tag,
    TrendingUp,
} from 'lucide-react';
import { useProductDetails } from '../../../../../presentation/hooks/useProductDetails';
import { ProductVariant } from '../../../../../core/entities/ecommerce';
import {
    getUniqueColors,
    getUniqueSizes,
    findVariantByAttributes,
    canPurchaseVariant,
    getStockStatus,
} from '../../../../../shared/utils/variant.utils';
import { safeToFixed, formatCurrency } from '../../../../../shared/utils/number.utils';

export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const { product, variants, isLoading, error } = useProductDetails(productId);

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [quantity, setQuantity] = useState(1);

    // Get unique colors and sizes
    const colors = variants ? getUniqueColors(variants) : [];
    const sizes = variants ? getUniqueSizes(variants) : [];

    // Find selected variant
    const selectedVariant =
        selectedSize && selectedColor
            ? findVariantByAttributes(variants, selectedSize, selectedColor)
            : variants[0];

    // Get stock status
    const stockStatus = selectedVariant ? getStockStatus(selectedVariant) : null;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Error state with detailed debugging
    if (error || !product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-2xl">
                    <p className="text-red-600 font-bold text-xl mb-2">Error loading product</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-slate-600 mb-2"><strong>Product ID:</strong> {productId}</p>
                        <p className="text-sm text-slate-600 mb-2"><strong>Error:</strong> {error ? String(error) : 'No error, but product is null'}</p>
                        <p className="text-sm text-slate-600"><strong>API Endpoint:</strong> /api/v1/products/{productId}</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const rating = product.rating ?? 0;
    const basePrice = selectedVariant?.basePrice ?? product.basePrice ?? 0;
    const discountPercentage = product.discountPercentage ?? 0;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Products</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Product Image */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="relative aspect-square bg-slate-100 rounded-lg mb-4">
                        {product.primaryImageUrl ? (
                            <img
                                src={product.primaryImageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full">
                                <Package className="w-24 h-24 text-slate-300" />
                            </div>
                        )}

                        {/* Badges */}
                        {product.isOnSale && discountPercentage > 0 && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                                -{safeToFixed(discountPercentage, 0)}% OFF
                            </div>
                        )}

                        {product.is360Enabled && (
                            <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-lg font-medium text-sm">
                                360° View Available
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="aspect-square bg-slate-100 rounded-lg border-2 border-transparent hover:border-blue-500 cursor-pointer transition-colors"
                            >
                                {product.primaryImageUrl ? (
                                    <img
                                        src={product.primaryImageUrl}
                                        alt={`Thumbnail ${i}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                        <Package className="w-8 h-8 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {product.brandName && (
                                <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {product.brandName}
                </span>
                            )}
                            {product.categoryName && (
                                <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                                    {product.categoryName}
                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${
                                            i < Math.floor(rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-slate-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-slate-700 font-medium">{safeToFixed(rating, 1)}</span>
                            <span className="text-slate-500">({product.totalReviews} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-4">
                            <p className="text-4xl font-bold text-slate-900">
                                {formatCurrency(basePrice)}
                            </p>
                            {product.isOnSale && discountPercentage > 0 && (
                                <p className="text-xl text-slate-500 line-through">
                                    {formatCurrency(basePrice / (1 - discountPercentage / 100))}
                                </p>
                            )}
                        </div>

                        {/* Provider Info */}
                        {product.providerName && (
                            <div className="flex items-center gap-2 text-slate-600 mb-4">
                                <Store className="w-5 h-5" />
                                <span>Sold by: {product.providerName}</span>
                            </div>
                        )}
                    </div>

                    {/* Stock Status */}
                    {stockStatus && (
                        <div
                            className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
                                stockStatus.status === 'in-stock'
                                    ? 'bg-green-50 text-green-700'
                                    : stockStatus.status === 'low-stock'
                                        ? 'bg-yellow-50 text-yellow-700'
                                        : 'bg-red-50 text-red-700'
                            }`}
                        >
                            <Package className="w-5 h-5" />
                            <span className="font-medium">{stockStatus.label}</span>
                            {selectedVariant && (
                                <span className="text-sm">
                  ({selectedVariant.stockQuantity} units available)
                </span>
                            )}
                        </div>
                    )}

                    {/* Variant Selection */}
                    {variants.length > 0 && (
                        <div className="space-y-4">
                            {/* Size Selection */}
                            {sizes.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Size {selectedSize && <span className="text-blue-600">({selectedSize})</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map((size) => {
                                            const isSelected = selectedSize === size;
                                            const variant = findVariantByAttributes(
                                                variants,
                                                size,
                                                selectedColor || colors[0]
                                            );
                                            const canPurchase = variant ? canPurchaseVariant(variant) : false;

                                            return (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    disabled={!canPurchase}
                                                    className={`px-4 py-2 rounded-lg border-2 font-medium uppercase transition-all ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                            : canPurchase
                                                                ? 'border-slate-300 hover:border-blue-400'
                                                                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Color Selection */}
                            {colors.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Color {selectedColor && <span className="text-blue-600">({selectedColor})</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((color) => {
                                            const isSelected = selectedColor === color;
                                            const variant = findVariantByAttributes(
                                                variants,
                                                selectedSize || sizes[0],
                                                color
                                            );
                                            const canPurchase = variant ? canPurchaseVariant(variant) : false;

                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    disabled={!canPurchase}
                                                    className={`px-4 py-2 rounded-lg border-2 font-medium capitalize transition-all ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                            : canPurchase
                                                                ? 'border-slate-300 hover:border-blue-400'
                                                                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {color}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Quantity</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-bold"
                            >
                                -
                            </button>
                            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                            <button
                                onClick={() =>
                                    setQuantity((q) =>
                                        Math.min(selectedVariant?.stockQuantity ?? 99, q + 1)
                                    )
                                }
                                className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            disabled={!selectedVariant || !canPurchaseVariant(selectedVariant)}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                        </button>
                        <button className="px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Selected Variant Info */}
                    {selectedVariant && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Selected Variant:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-slate-600">SKU:</span>
                                    <span className="ml-2 font-medium">{selectedVariant.sku}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600">Stock:</span>
                                    <span className="ml-2 font-medium">{selectedVariant.stockQuantity}</span>
                                </div>
                                {selectedVariant.barcode && (
                                    <div>
                                        <span className="text-slate-600">Barcode:</span>
                                        <span className="ml-2 font-medium">{selectedVariant.barcode}</span>
                                    </div>
                                )}
                                {selectedVariant.weight && (
                                    <div>
                                        <span className="text-slate-600">Weight:</span>
                                        <span className="ml-2 font-medium">{selectedVariant.weight}g</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Description</h2>
                <p className="text-slate-700 leading-relaxed">{product.description}</p>
            </div>

            {/* All Variants Table */}
            {variants.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        All Variants ({variants.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Size</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Color</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">SKU</th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-700">Price</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Stock</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {variants.map((variant) => {
                                const status = getStockStatus(variant);
                                return (
                                    <tr key={variant.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 font-medium uppercase">{variant.size}</td>
                                        <td className="py-3 px-4 capitalize">{variant.color}</td>
                                        <td className="py-3 px-4 text-slate-600">{variant.sku}</td>
                                        <td className="py-3 px-4 text-right font-semibold">
                                            {formatCurrency(variant.basePrice)}
                                        </td>
                                        <td className="py-3 px-4 text-center">{variant.stockQuantity}</td>
                                        <td className="py-3 px-4 text-center">
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                status.status === 'in-stock'
                                    ? 'bg-green-100 text-green-700'
                                    : status.status === 'low-stock'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {status.label}
                        </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}