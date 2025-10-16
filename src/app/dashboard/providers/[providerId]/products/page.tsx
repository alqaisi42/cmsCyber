// src/app/dashboard/providers/[providerId]/products/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Package,
    DollarSign,
    Star,
    Tag,
    Layers
} from 'lucide-react';
import Link from 'next/link';
import {useProvider, useProviderProducts} from "../../../../../presentation/hooks/useProviders";
import {Button} from "../../../../../presentation/components/ui";
import {Product} from "../../../../../core/entities";

export default function ProviderProductsPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.id as string;

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 12;

    const { data: provider, isLoading: providerLoading } = useProvider(providerId);
    const { data: productsData, isLoading: productsLoading } = useProviderProducts(
        providerId,
        currentPage,
        pageSize
    );

    const filteredProducts = productsData?.content.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brandName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (providerLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        {provider?.logoUrl && (
                            <img
                                src={provider.logoUrl}
                                alt={provider.name}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{provider?.name} Products</h1>
                            <p className="text-gray-600">
                                {productsData?.totalElements || 0} products
                            </p>
                        </div>
                    </div>
                </div>
                <Link href={`/dashboard/products/new?providerId=${providerId}`}>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                        Add Product
                    </Button>
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search products by name or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                        {searchQuery ? 'Try adjusting your search query' : 'This provider has no products yet'}
                    </p>
                    <Link href={`/dashboard/products/new?providerId=${providerId}`}>
                        <Button variant="primary">Add First Product</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {productsData && productsData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                Previous
                            </Button>
                            <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage + 1} of {productsData.totalPages}
              </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= productsData.totalPages - 1}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ProductCard({ product }: { product: Product }) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
                {product.primaryImageUrl ? (
                    <img
                        src={product.primaryImageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                    {product.isOnSale && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              -{product.discountPercentage}% OFF
            </span>
                    )}
                    {product.is360Enabled && (
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
              360°
            </span>
                    )}
                </div>

                {/* Stock Badge */}
                <div className="absolute bottom-2 left-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
              product.totalStock > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
          }`}>
            {product.totalStock > 0 ? `${product.totalStock} in stock` : 'Out of stock'}
          </span>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">{product.brandName}</p>
                </div>

                {/* Category */}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{product.category.name}</span>
                </div>

                {/* Rating */}
                {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>
                )}

                {/* Price */}
                <div>
                    {product.isOnSale ? (
                        <div>
                            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  ${product.basePrice.toFixed(2)}
                </span>
                                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                            </div>
                            <p className="text-xs text-gray-600">{product.priceRange}</p>
                        </div>
                    ) : (
                        <div>
              <span className="text-lg font-bold text-gray-900">
                ${product.basePrice.toFixed(2)}
              </span>
                            <p className="text-xs text-gray-600">{product.priceRange}</p>
                        </div>
                    )}
                </div>

                {/* Variants Info */}
                <div className="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <span>{product.availableSizes.length} sizes</span>
                    <span>•</span>
                    <span>{product.availableColors.length} colors</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    <Link href={`/dashboard/products/${product.id}/variants`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full">
                            <Layers className="w-4 h-4 mr-1" />
                            Variants
                        </Button>
                    </Link>
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Button variant="secondary" size="sm">
                            <Edit className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}