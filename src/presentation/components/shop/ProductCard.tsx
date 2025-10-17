'use client';

import { ShoppingCart, Star, Package, Eye, Tag } from 'lucide-react';
import { ShopProduct } from '../../../core/entities/ecommerce';

interface ProductCardProps {
    product: ShopProduct;
    onView: (id: string) => void;
}

export function ProductCard({ product, onView }: ProductCardProps) {
    // ✅ FIX: Safe handling of potentially null/undefined values
    const rating = product.rating ?? 0;
    const basePrice = product.basePrice ?? 0;
    const totalStock = product.totalStock ?? 0;
    const discountPercentage = product.discountPercentage ?? 0;

    // Calculate original price if on sale
    const originalPrice = product.isOnSale && discountPercentage > 0
        ? basePrice / (1 - discountPercentage / 100)
        : basePrice;

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
            {/* Product Image */}
            <div className="relative h-48 bg-slate-100">
                {product.primaryImageUrl ? (
                    <img
                        src={product.primaryImageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-slate-300"/>
                    </div>
                )}

                {/* Sale Badge */}
                {product.isOnSale && (
                    <div
                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Stock Status Badge */}
                <div
                    className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${
                        totalStock > 0
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}
                >
                    {totalStock > 0 ? 'In Stock' : 'Out of Stock'}
                </div>

                {/* 360 Badge */}
                {product.is360Enabled && (
                    <div
                        className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                        360° View
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="p-4">
                {/* Brand & Category */}
                <div className="flex items-center gap-2 mb-2">
                    {product.brandName && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {product.brandName}
            </span>
                    )}
                    {product.categoryName && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
              <Tag className="w-3 h-3"/>
                            {product.categoryName}
            </span>
                    )}
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-4 h-4 ${
                                i < Math.floor(rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                            }`}
                        />
                    ))}
                    {/* ✅ FIX: Safe toFixed() call */}
                    <span className="text-xs text-slate-600 ml-1">
            {rating.toFixed(1)}
          </span>
                </div>

                {/* Price Section */}
                <div className="flex items-end justify-between mb-3">
                    <div>
                        {/* ✅ FIX: Safe toFixed() calls */}
                        <p className="text-2xl font-bold text-slate-900">
                            {product.priceRange || `$${basePrice.toFixed(2)}`}
                        </p>
                        {product.isOnSale && discountPercentage > 0 && (
                            <p className="text-sm text-slate-500 line-through">
                                ${originalPrice.toFixed(2)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                        <Package className="w-4 h-4"/>
                        <span className="text-sm">{totalStock}</span>
                    </div>
                </div>

                {/* View Details Button */}
                <button
                    onClick={() => onView(product.id)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Eye className="w-4 h-4"/>
                    View Details
                </button>
            </div>
        </div>
    );

}