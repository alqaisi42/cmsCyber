// Location: src/presentation/components/shop/ProductCard.tsx

'use client';

import { Star, Package, Tag, Eye } from 'lucide-react';
import { ShopProduct } from '../../../core/entities/ecommerce';

interface ProductCardProps {
    product: ShopProduct;
    onView: (id: string) => void;
}

export function ProductCard({ product, onView }: ProductCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
                {product.primaryImageUrl ? (
                    <img
                        src={product.primaryImageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-400" />
                    </div>
                )}
                {product.isOnSale && product.discountPercentage > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{product.discountPercentage}%
          </span>
                )}
                {product.is360Enabled && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
            360°
          </span>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        {product.brandName && (
                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                                {product.brandName}
                            </p>
                        )}
                        <h3 className="font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
                    </div>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {product.description}
                </p>

                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-3 h-3 ${
                                i < Math.floor(product.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                            }`}
                        />
                    ))}
                    <span className="text-xs text-slate-600 ml-1">
            {product.rating.toFixed(1)}
          </span>
                </div>

                <div className="flex items-end justify-between mb-3">
                    <div>
                        <p className="text-2xl font-bold text-slate-900">
                            {product.priceRange || `$${product.basePrice.toFixed(2)}`}
                        </p>
                        {product.isOnSale && (
                            <p className="text-sm text-slate-500 line-through">
                                ${(product.basePrice / (1 - product.discountPercentage / 100)).toFixed(2)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">{product.totalStock}</span>
                    </div>
                </div>

                <button
                    onClick={() => onView(product.id)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </button>
            </div>
        </div>
    );
}
