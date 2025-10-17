
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Search, Grid, List } from 'lucide-react';
import { ProductCard } from '../../../../../../presentation/components/shop/ProductCard';
import {useProviderById, useProviderProducts} from "../../../../../../presentation/hooks/useShop";

export default function ProviderProductsPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;

    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: provider } = useProviderById(providerId);
    const { data: productsResponse, isLoading, error } = useProviderProducts(providerId, page, 20);

    const filteredProducts = productsResponse?.data?.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !productsResponse) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 font-bold">Error loading products</p>
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

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Providers</span>
                </button>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-4">
                        {provider?.logoUrl && (
                            <img
                                src={provider.logoUrl}
                                alt={provider.name}
                                className="w-20 h-20 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-900">{provider?.name || 'Provider'}</h1>
                            <p className="text-slate-600 mt-1">
                                {productsResponse.total} products available
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & View Toggle */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
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
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                    }>
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onView={(id) => router.push(`/dashboard/shop/products/${id}`)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {productsResponse.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-slate-700">
                Page {page + 1} of {productsResponse.totalPages}
              </span>
                            <button
                                onClick={() => setPage(p => Math.min(productsResponse.totalPages - 1, p + 1))}
                                disabled={page >= productsResponse.totalPages - 1}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search</p>
                </div>
            )}
        </div>
    );
}