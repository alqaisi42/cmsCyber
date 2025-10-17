// =============================================================================
// File: src/presentation/components/shop/ProductCard.tsx
// Standalone Product Card Component - With Images & Variants
// =============================================================================

'use client';

import { Package, Eye, Edit, Palette, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        description: string;
        basePrice: number | null;
        totalStock: number | null;          // ✅ Changed from stockQuantity
        stockQuantity?: number;              // ✅ Keep as optional fallback
        imageUrl?: string;
        primaryImageUrl?: string;
        thumbnailUrl?: string;
        images?: string[];
        totalVariants?: number;
        brandName?: string;
        rating?: number | null;
        discount?: number;
        discountPercentage?: number | null;  // ✅ Added
        isOnSale?: boolean;
    };
    viewMode?: 'grid' | 'list';
    onView: (id: string) => void;
    onEdit?: (id: string) => void;
    showActions?: boolean;
}

export function ProductCard({
                                product,
                                viewMode = 'grid',
                                onView,
                                onEdit,
                                showActions = true
                            }: ProductCardProps) {
    // ✅ Get stock quantity with fallback
    const stockQuantity = product.totalStock ?? product.stockQuantity ?? 0;
    const basePrice = product.basePrice ?? 0;
    const discount = product.discountPercentage ?? product.discount ?? 0;

    // Stock status
    const stockStatus = stockQuantity === 0
        ? { bgClass: 'bg-red-100', textClass: 'text-red-700', text: 'Out of Stock' }
        : stockQuantity <= 10
            ? { bgClass: 'bg-yellow-100', textClass: 'text-yellow-700', text: 'Low Stock' }
            : { bgClass: 'bg-green-100', textClass: 'text-green-700', text: 'In Stock' };

    // Get image URL with fallbacks
    const getImageUrl = (): string | null => {
        return product.imageUrl ||
            product.primaryImageUrl ||
            product.thumbnailUrl ||
            (product.images && product.images[0]) ||
            null;
    };

    const imageUrl = getImageUrl();

    // Calculate discounted price
    const finalPrice = discount > 0
        ? basePrice * (1 - discount / 100)
        : basePrice;

    // Render image with fallback
    const renderImage = (className: string) => {
        if (imageUrl) {
            return (
                <img
                    src={imageUrl}
                    alt={product.name}
                    className={className}
                    onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement!;
                        if (parent) {
                            parent.classList.add('flex', 'items-center', 'justify-center');
                            parent.innerHTML = `
                                <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                            `;
                        }
                    }}
                />
            );
        }
        return <Package className="w-12 h-12 text-slate-400" />;
    };

    // List View
    if (viewMode === 'list') {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {renderImage('w-full h-full object-cover')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate flex-1 text-lg">
                                {product.name}
                            </h3>
                            {product.totalVariants && product.totalVariants > 0 && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium whitespace-nowrap">
                                    <Palette className="w-3 h-3" />
                                    {product.totalVariants}
                                </span>
                            )}
                        </div>

                        {product.brandName && (
                            <p className="text-xs text-slate-500 mb-2">{product.brandName}</p>
                        )}

                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {product.description}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                {discount > 0 ? (
                                    <>
                                        <span className="text-xl font-bold text-blue-600">
                                            ${finalPrice.toFixed(2)}
                                        </span>
                                        <span className="text-sm text-slate-400 line-through">
                                            ${basePrice.toFixed(2)}
                                        </span>
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                            -{discount}%
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xl font-bold text-blue-600">
                                        ${basePrice.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            <span className={`px-3 py-1 rounded text-xs font-medium ${stockStatus.bgClass} ${stockStatus.textClass}`}>
                                {stockStatus.text}
                            </span>

                            <span className="text-sm text-slate-600">
                                Stock: {stockQuantity} units
                            </span>

                            {product.rating && (
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-sm font-medium text-slate-700">
                                        {product.rating.toFixed(1)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                onClick={() => onView(product.id)}
                                className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="View Details"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(product.id)}
                                    className="p-3 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                    title="Edit Product"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
            {/* Image Container */}
            <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {renderImage('w-full h-full object-cover group-hover:scale-105 transition-transform duration-200')}

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {discount > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded shadow-lg">
                            -{discount}%
                        </span>
                    )}
                    {product.totalVariants && product.totalVariants > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded bg-purple-600 text-white text-xs font-medium shadow-lg">
                            <Palette className="w-3 h-3" />
                            {product.totalVariants}
                        </span>
                    )}
                </div>

                {/* Quick Actions (shown on hover) */}
                {showActions && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={() => onView(product.id)}
                            className="p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
                            title="View Details"
                        >
                            <Eye className="w-5 h-5 text-blue-600" />
                        </button>
                        {onEdit && (
                            <button
                                onClick={() => onEdit(product.id)}
                                className="p-3 bg-white rounded-lg hover:bg-slate-100 transition-colors shadow-lg"
                                title="Edit"
                            >
                                <Edit className="w-5 h-5 text-slate-700" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                {/* Title & Brand */}
                <div className="mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 mb-1" title={product.name}>
                        {product.name}
                    </h3>
                    {product.brandName && (
                        <p className="text-xs text-slate-500">{product.brandName}</p>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-3 line-clamp-2" title={product.description}>
                    {product.description}
                </p>

                {/* Rating */}
                {product.rating && (
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={star <= product.rating! ? 'text-yellow-400' : 'text-slate-300'}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <span className="text-xs text-slate-600">({product.rating.toFixed(1)})</span>
                    </div>
                )}

                {/* Price & Stock */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                        {discount > 0 ? (
                            <>
                                <span className="text-xl font-bold text-blue-600">
                                    ${finalPrice.toFixed(2)}
                                </span>
                                <span className="text-sm text-slate-400 line-through">
                                    ${basePrice.toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span className="text-xl font-bold text-blue-600">
                                ${basePrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.bgClass} ${stockStatus.textClass}`}>
                        {stockStatus.text}
                    </span>
                </div>

                {/* Stock & Variants Info */}
                <div className="text-xs text-slate-600 mb-3 flex items-center justify-between">
                    <span>Stock: {stockQuantity}</span>
                    {product.totalVariants && product.totalVariants > 0 && (
                        <span className="text-purple-600 font-medium">
                            {product.totalVariants} variants
                        </span>
                    )}
                </div>

                {/* Action Button */}
                {showActions && (
                    <button
                        onClick={() => onView(product.id)}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
}