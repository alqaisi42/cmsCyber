// =============================================================================
// File: src/app/dashboard/shop/providers/[providerId]/products/page.tsx
// FIXED - Products List Page with Variants Support
// =============================================================================

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package, Search, Filter, Plus, TrendingUp,
    Grid, List, Eye, Edit, Trash2, AlertCircle
} from 'lucide-react';
import { useProviderProducts, useProviderById } from '../../../../../../presentation/hooks/useShop';

export default function ProviderProductsPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 12;

    // Fetch provider info and products
    const { data: provider } = useProviderById(providerId);
    const { data: productsResponse, isLoading, error } = useProviderProducts(
        providerId,
        currentPage,
        pageSize
    );

    // Filter products by search
    const filteredProducts = productsResponse?.data?.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading products...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 text-center mb-2">
                        Error loading products
                    </h2>
                    <p className="text-red-700 text-center text-sm mb-4">
                        {error instanceof Error ? error.message : 'Unknown error occurred'}
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
                    ← Back to Providers
                </button>

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Package className="w-8 h-8 text-blue-600" />
                            {provider?.name} Products
                        </h1>
                        <p className="text-slate-600 mt-1">
                            {productsResponse?.total || 0} products available
                        </p>
                    </div>
                    <button
                        onClick={() => router.push(`/dashboard/shop/providers/${providerId}/products/new`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </button>
                </div>

                {/* Stats */}
                {productsResponse && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Total Products</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {productsResponse.total}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">In Stock</p>
                            <p className="text-2xl font-bold text-green-600">
                                {productsResponse.data.filter(p => p.totalStock > 0).length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Low Stock</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {productsResponse.data.filter(p =>
                                    p.totalStock > 0 && p.totalStock <= 10
                                ).length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">
                                {productsResponse.data.filter(p => p.totalStock === 0).length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid/List */}
            {filteredProducts && filteredProducts.length > 0 ? (
                <>
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'space-y-4'
                    }>
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                viewMode={viewMode}
                                onView={() => router.push(`/dashboard/shop/products/${product.id}`)}
                                onEdit={() => router.push(`/dashboard/shop/products/${product.id}/edit`)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {productsResponse && productsResponse.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-slate-700">
                                Page {currentPage + 1} of {productsResponse.totalPages}
                            </span>
                            <button
                                disabled={currentPage >= productsResponse.totalPages - 1}
                                onClick={() => setCurrentPage(p => Math.min(productsResponse.totalPages - 1, p + 1))}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No products found</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {searchQuery ? 'Try adjusting your search' : 'Start by adding your first product'}
                    </p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Product Card Component
// =============================================================================

interface ProductCardProps {
    product: any;
    viewMode: 'grid' | 'list';
    onView: () => void;
    onEdit: () => void;
}

function ProductCard({ product, viewMode, onView, onEdit }: ProductCardProps) {
    const stockStatus = product.stockQuantity === 0
        ? { color: 'red', text: 'Out of Stock' }
        : product.stockQuantity <= 10
            ? { color: 'yellow', text: 'Low Stock' }
            : { color: 'green', text: 'In Stock' };

    if (viewMode === 'list') {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-8 h-8 text-slate-400" />
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-slate-600 line-clamp-1">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-blue-600">
                                ${product.basePrice.toFixed(2)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${stockStatus.color}-100 text-${stockStatus.color}-700`}>
                                {stockStatus.text}
                            </span>
                            <span className="text-sm text-slate-600">
                                Stock: {product.stockQuantity}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={onView}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
            {/* Product Image */}
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package className="w-16 h-16 text-slate-400" />
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                    {product.name}
                </h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {product.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-blue-600">
                        ${product.basePrice.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-${stockStatus.color}-100 text-${stockStatus.color}-700`}>
                        {stockStatus.text}
                    </span>
                </div>

                <div className="text-sm text-slate-600 mb-3">
                    Stock: {product.stockQuantity} units
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onView}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                    >
                        <Eye className="w-4 h-4" />
                        View
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}