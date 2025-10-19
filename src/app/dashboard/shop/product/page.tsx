'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Search } from 'lucide-react';
import { useSearchProducts } from '../../../../presentation/hooks/useShop';
import { ProductCard } from '../../../../presentation/components/shop/ProductCard';
import { ShopProduct, ProductSearchParams } from '../../../../core/entities/ecommerce';

function toProductCardModel(product: ShopProduct) {
    const extractImageUrls = (images?: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) return images.map(img => img?.url).filter(Boolean);
        if (typeof images === 'object')
            return Object.values(images)
                .map((group: any) => group?.url)
                .filter(Boolean);
        return [];
    };

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        totalStock: product.totalStock,
        stockQuantity: product.totalStock,
        imageUrl:
            product.primaryImageUrl ||
            product.primaryImageUrl ||
            extractImageUrls(product.images)[0] ||
            undefined,
        images: extractImageUrls(product.images),

        // ✅ FIX: convert array → count
        totalVariants: Array.isArray(product.variants)
            ? product.variants.length
            : product.variants ?? 0,

        brandName: product.brandName,
        rating: product.rating,
        discount: 0,
        discountPercentage: product.discountPercentage,
        isOnSale: product.isOnSale,
    };
}


export default function AllProductsPage() {
    const router = useRouter();

    const [searchParams, setSearchParams] = useState<ProductSearchParams>({
        page: 0,
        size: 20,
        sortBy: 'newest',
    });

    const [searchQuery, setSearchQuery] = useState('');

    const { data: productsResponse, isLoading, error } =
        useSearchProducts(searchParams);

    const handleSearch = () => {
        setSearchParams((prev) => ({ ...prev, keyword: searchQuery, page: 0 }));
    };

    const handleSortChange = (sortBy: ProductSearchParams['sortBy']) => {
        setSearchParams((prev) => ({ ...prev, sortBy, page: 0 }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-4">
                    <Package className="w-8 h-8 text-blue-600" />
                    All Products
                </h1>

                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Search
                            </button>
                        </div>

                        <select
                            value={searchParams.sortBy}
                            onChange={(e) =>
                                handleSortChange(e.target.value as ProductSearchParams['sortBy'])
                            }
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="newest">Newest First</option>
                            <option value="priceAsc">Price: Low to High</option>
                            <option value="priceDesc">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                        </select>
                    </div>
                </div>

                {productsResponse && (
                    <p className="text-slate-600 mt-4">
                        Found {productsResponse.total} products
                    </p>
                )}
            </div>

            {/* Products Grid */}
            {productsResponse && productsResponse.data.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productsResponse.data.map((product) => {
                            const normalized = toProductCardModel(product);
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={normalized}
                                    onView={(id) => router.push(`/dashboard/shop/products/${id}`)}
                                />
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {productsResponse.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                onClick={() =>
                                    setSearchParams((prev) => ({
                                        ...prev,
                                        page: Math.max(0, prev.page - 1),
                                    }))
                                }
                                disabled={searchParams.page === 0}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-slate-700">
                Page {searchParams.page + 1} of {productsResponse.totalPages}
              </span>
                            <button
                                onClick={() =>
                                    setSearchParams((prev) => ({
                                        ...prev,
                                        page: Math.min(
                                            productsResponse.totalPages - 1,
                                            prev.page + 1,
                                        ),
                                    }))
                                }
                                disabled={searchParams.page >= productsResponse.totalPages - 1}
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
                </div>
            )}
        </div>
    );
}
