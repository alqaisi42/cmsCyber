// src/app/dashboard/shop/products/[productId]/page.tsx
// Product Details Page with Variants and 360° View

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Star, Package, Truck, Shield, Heart,
    ShoppingCart
} from 'lucide-react';
import {useProductDetails} from "../../../../../../presentation/hooks/useProductDetails";
import {ProductVariant} from "../../../../../../core/entities/ecommerce";
import {productImageService} from "../../../../../../infrastructure/services/product-image.service";
import {ProductImageGallery} from "../../../../../../presentation/components/shop/ProductImageGallery";
import {VariantSelector} from "../../../../../../presentation/components/shop/VariantSelector";
import {canPurchaseVariant} from "../../../../../../shared/utils/variant.utils";


export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const { product, variants, images, groupedImages, isLoading, error } = useProductDetails(productId);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
    const [quantity, setQuantity] = useState(1);

    // Get images for selected variant
    const variantImages = selectedVariant && groupedImages
        ? productImageService.getVariantImages(images, selectedVariant.id)
        : [];

    const displayImages = variantImages.length > 0 ? variantImages : images;

    // Get 360 images for selected variant
    const images360 = selectedVariant && groupedImages
        ? productImageService.get360Images(images, selectedVariant.id, selectedVariant.color)
        : groupedImages?.all360 || [];

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 font-bold">Error loading product</p>
                    <p className="text-sm text-slate-600 mt-2">{String(error)}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleQuantityChange = (delta: number) => {
        const maxStock = selectedVariant?.stockQuantity || 0;
        const newQty = Math.max(1, Math.min(quantity + delta, maxStock));
        setQuantity(newQty);
    };

    const handleAddToCart = () => {
        if (!selectedVariant) return;
        console.log('Add to cart:', { variant: selectedVariant, quantity });
        alert(`Added ${quantity}x ${product.name} (${selectedVariant.color}/${selectedVariant.size}) to cart`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Products</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Images */}
                    <div>
                        <ProductImageGallery
                            images={displayImages}
                            images360={images360}
                            has360={product.is360Enabled}
                        />
                    </div>

                    {/* Right Column - Product Info */}
                    <div className="space-y-6">
                        {/* Brand & Title */}
                        <div>
                            {product.brandName && (
                                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                                    {product.brandName}
                                </p>
                            )}
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                                i < Math.floor(product.rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-slate-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-slate-600">
                                    {product.rating.toFixed(1)} ({variants.length} variants)
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            {product.priceRange ? (
                                <p className="text-3xl font-bold text-slate-900">
                                    {product.priceRange}
                                </p>
                            ) : (
                                <p className="text-3xl font-bold text-slate-900">
                                    ${product.basePrice.toFixed(2)}
                                </p>
                            )}
                            {product.isOnSale && product.discountPercentage > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-lg text-slate-500 line-through">
                                        ${(product.basePrice / (1 - product.discountPercentage / 100)).toFixed(2)}
                                    </span>
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                                        {product.discountPercentage}% OFF
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="border-t border-slate-200 pt-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Variant Selector */}
                        {variants.length > 0 && (
                            <div className="border-t border-slate-200 pt-6">
                                <VariantSelector
                                    variants={variants}
                                    selectedVariant={selectedVariant}
                                    onVariantChange={setSelectedVariant}
                                />
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        <div className="border-t border-slate-200 pt-6 space-y-4">
                            {/* Quantity Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                    Quantity
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                        className="w-10 h-10 rounded-lg border-2 border-slate-300 hover:border-blue-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-20 h-10 text-center border-2 border-slate-300 rounded-lg font-medium"
                                        min="1"
                                        max={selectedVariant?.stockQuantity || 999}
                                    />
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= (selectedVariant?.stockQuantity || 999)}
                                        className="w-10 h-10 rounded-lg border-2 border-slate-300 hover:border-blue-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!selectedVariant || !canPurchaseVariant(selectedVariant)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </button>
                                <button className="w-12 h-12 border-2 border-slate-300 hover:border-red-500 hover:text-red-500 rounded-lg flex items-center justify-center transition-colors">
                                    <Heart className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Free Shipping</p>
                                    <p className="text-xs text-slate-600">On orders over $50</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Secure Payment</p>
                                    <p className="text-xs text-slate-600">100% protected</p>
                                </div>
                            </div>
                        </div>

                        {/* Stock Info */}
                        {selectedVariant && (
                            <div className="bg-slate-100 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-slate-600" />
                                    <span className="text-slate-700">
                                        {selectedVariant.stockQuantity > 0
                                            ? `${selectedVariant.stockQuantity} units available`
                                            : 'Out of stock'
                                        }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variants Table */}
                <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Available Variants
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">SKU</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Size</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Color</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                            {variants.map(variant => (
                                <tr key={variant.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{variant.sku}</td>
                                    <td className="px-4 py-3 text-sm uppercase font-medium">{variant.size}</td>
                                    <td className="px-4 py-3 text-sm capitalize">{variant.color}</td>
                                    <td className="px-4 py-3 text-sm font-semibold">${variant.basePrice.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm">{variant.stockQuantity}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            variant.isAvailable && variant.stockQuantity > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {variant.isAvailable && variant.stockQuantity > 0 ? 'In Stock' : 'Unavailable'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}