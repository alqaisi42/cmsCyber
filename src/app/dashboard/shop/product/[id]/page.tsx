// =============================================================================
// File: src/app/dashboard/shop/products/[productId]/page.tsx
// NEW - Product Detail Page with Variants Display
// =============================================================================

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Package, DollarSign, Box, Palette,
    Ruler, Barcode, AlertCircle, Eye, Edit, Trash2,
    ShoppingCart, Heart, Share2, Check, X
} from 'lucide-react';
import { useProductById, useProductVariants } from '../../../../../presentation/hooks/useShop';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'details' | 'variants' | 'specifications'>('details');

    // Fetch product and variants
    const { data: productResponse, isLoading: productLoading, error: productError } = useProductById(productId);
    const { data: variantsResponse, isLoading: variantsLoading } = useProductVariants(productId);

    const product = productResponse?.data;
    const variants = variantsResponse?.data || [];

    // Get unique colors and sizes from variants
    const availableColors = [...new Set(variants.map(v => v.color))];
    const availableSizes = [...new Set(variants.map(v => v.size))];

    // Find selected variant
    const selectedVariant = variants.find(
        v => v.color === selectedColor && v.size === selectedSize
    );

    // Auto-select first available options
    if (!selectedColor && availableColors.length > 0) {
        setSelectedColor(availableColors[0]);
    }
    if (!selectedSize && availableSizes.length > 0) {
        setSelectedSize(availableSizes[0]);
    }

    // Loading state
    if (productLoading || variantsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading product...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (productError || !product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 text-center mb-2">
                        Error loading product
                    </h2>
                    <p className="text-red-700 text-center text-sm mb-4">
                        {productError instanceof Error ? productError.message : 'Product not found'}
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

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left: Product Image */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                        {product.primaryImageUrl || selectedVariant?.images?.[0]?.imageUrl ? (
                            <img
                                src={selectedVariant?.images?.[0]?.imageUrl || product.primaryImageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-24 h-24 text-slate-400" />
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {selectedVariant?.images && selectedVariant.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {selectedVariant.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500"
                                >
                                    <img
                                        src={img.imageUrl}
                                        alt={`${product.name} ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    {/* Product Name & Price */}
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {product.name}
                    </h1>
                    {product.brandName && (
                        <p className="text-slate-600 mb-4">Brand: {product.brandName}</p>
                    )}

                    <div className="mb-6">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-blue-600">
                                ${selectedVariant?.basePrice.toFixed(2) || product.basePrice.toFixed(2)}
                            </span>
                            {selectedVariant?.priceAdjustment && selectedVariant.priceAdjustment !== 0 && (
                                <span className={`text-lg ${selectedVariant.priceAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {selectedVariant.priceAdjustment > 0 ? '+' : ''}
                                    ${Math.abs(selectedVariant.priceAdjustment).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Color Selection */}
                    {availableColors.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Color: {selectedColor}
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                                {availableColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                            selectedColor === color
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                                        }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size Selection */}
                    {availableSizes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Ruler className="w-5 h-5" />
                                Size: {selectedSize}
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                                {availableSizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                            selectedSize === size
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stock Status */}
                    {selectedVariant && (
                        <div className="mb-6">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                                <Box className="w-5 h-5 text-slate-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">
                                        Stock: {selectedVariant.stockQuantity} units
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        SKU: {selectedVariant.sku}
                                    </p>
                                </div>
                                <div>
                                    {selectedVariant.isAvailable ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                            <Check className="w-4 h-4" />
                                            Available
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                            <X className="w-4 h-4" />
                                            Unavailable
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-slate-900 mb-3">Quantity</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-bold"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 px-4 py-2 text-center border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(selectedVariant?.stockQuantity || 99, quantity + 1))}
                                className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            disabled={!selectedVariant || !selectedVariant.isAvailable || selectedVariant.stockQuantity === 0}
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
                </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Tab Headers */}
                <div className="border-b border-slate-200">
                    <div className="flex gap-4 px-6">
                        {['details', 'variants', 'specifications'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-4 font-semibold capitalize border-b-2 transition-colors ${
                                    activeTab === tab
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'details' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Description</h2>
                            <p className="text-slate-700 leading-relaxed">{product.description}</p>

                            {product.is360Enabled && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-blue-900 font-medium flex items-center gap-2">
                                        <Eye className="w-5 h-5" />
                                        360° View Available
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div>
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
                                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Stock</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {variants.map((variant) => (
                                        <tr key={variant.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">{variant.size}</td>
                                            <td className="py-3 px-4">{variant.color}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{variant.sku}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-blue-600">
                                                ${variant.basePrice.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right">{variant.stockQuantity}</td>
                                            <td className="py-3 px-4 text-center">
                                                {variant.isAvailable ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                            <Check className="w-3 h-3" />
                                                            Available
                                                        </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                                            <X className="w-3 h-3" />
                                                            Unavailable
                                                        </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'specifications' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Specifications</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedVariant?.barcode && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Barcode</p>
                                        <p className="font-semibold text-slate-900">{selectedVariant.barcode}</p>
                                    </div>
                                )}
                                {selectedVariant?.weight && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">Weight</p>
                                        <p className="font-semibold text-slate-900">{selectedVariant.weight} kg</p>
                                    </div>
                                )}
                                {selectedVariant?.inStockNo && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-600 mb-1">In Stock No</p>
                                        <p className="font-semibold text-slate-900">{selectedVariant.inStockNo}</p>
                                    </div>
                                )}
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-600 mb-1">Low Stock Threshold</p>
                                    <p className="font-semibold text-slate-900">
                                        {selectedVariant?.lowStockThreshold || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}