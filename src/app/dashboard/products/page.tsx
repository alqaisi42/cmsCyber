// src/app/dashboard/products/page.tsx
'use client';

import { useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    X,
    Package,
    Edit,
    Trash2,
    Layers,
    Star,
    Tag
} from 'lucide-react';
import Link from 'next/link';
import {Product, ProductColor, ProductSearchParams, ProductSize} from "../../../core/entities";
import {useProductSearch, useProviders} from "../../../presentation/hooks/useProviders";
import {Button} from "../../../presentation/components/ui";


const SIZES: ProductSize[] = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
const COLORS: ProductColor[] = [
    'black', 'white', 'red', 'blue', 'green',
    'yellow', 'pink', 'purple', 'orange', 'brown',
    'gray', 'navy', 'beige'
];

export default function AllProductsPage() {
    const [searchParams, setSearchParams] = useState<ProductSearchParams>({
        query: '',
        sortBy: 'newest',
        page: 0,
        size: 20
    });

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        providerIds: [] as string[],
        sizes: [] as ProductSize[],
        colors: [] as ProductColor[],
        minPrice: undefined as number | undefined,
        maxPrice: undefined as number | undefined
    });

    const { data: providers } = useProviders();
    const { data: productsData, isLoading } = useProductSearch(searchParams);

    const handleSearch = (query: string) => {
        setSearchParams(prev => ({ ...prev, query, page: 0 }));
    };

    const handleSortChange = (sortBy: any) => {
        setSearchParams(prev => ({ ...prev, sortBy, page: 0 }));
    };

    const applyFilters = () => {
        setSearchParams(prev => ({
            ...prev,
            ...filters,
            page: 0
        }));
        setShowFilters(false);
    };

    const clearFilters = () => {
        setFilters({
            providerIds: [],
            sizes: [],
            colors: [],
            minPrice: undefined,
            maxPrice: undefined
        });
        setSearchParams({
            query: searchParams.query,
            sortBy: 'newest',
            page: 0,
            size: 20
        });
    };

    const toggleArrayFilter = <T,>(
        key: 'providerIds' | 'sizes' | 'colors',
        value: T
    ) => {
        setFilters(prev => {
            const currentArray = prev[key] as T[];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [key]: newArray };
        });
    };

    const activeFiltersCount =
        filters.providerIds.length +
        filters.sizes.length +
        filters.colors.length +
        (filters.minPrice !== undefined ? 1 : 0) +
        (filters.maxPrice !== undefined ? 1 : 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
                    <p className="text-gray-600 mt-1">
                        {productsData?.totalElements || 0} products found
                    </p>
                </div>
                <Link href="/dashboard/products/new">
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                        Add Product
                    </Button>
                </Link>
            </div>

            {/* Search & Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products by name, brand, or SKU..."
                            value={searchParams.query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={searchParams.sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="price_low_high">Price: Low to High</option>
                        <option value="price_high_low">Price: High to Low</option>
                        <option value="popularity">Most Popular</option>
                        <option value="rating">Highest Rated</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className="relative"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        <button onClick={() => setShowFilters(false)}>
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Providers Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Providers
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {providers?.map(provider => (
                                    <label key={provider.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.providerIds.includes(provider.id)}
                                            onChange={() => toggleArrayFilter('providerIds', provider.id)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{provider.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Sizes Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sizes
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => toggleArrayFilter('sizes', size)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            filters.sizes.includes(size)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {size.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Colors
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => toggleArrayFilter('colors', color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                            filters.colors.includes(color)
                                                ? 'border-blue-600 ring-2 ring-blue-200'
                                                : 'border-gray-300'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price Range
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    placeholder="Min price"
                                    value={filters.minPrice || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        minPrice: e.target.value ? parseFloat(e.target.value) : undefined
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Max price"
                                    value={filters.maxPrice || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        maxPrice: e.target.value ? parseFloat(e.target.value) : undefined
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button variant="secondary" onClick={clearFilters}>
                            Clear All
                        </Button>
                        <Button variant="primary" onClick={applyFilters}>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : !productsData || productsData.content.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                        Try adjusting your search or filters
                    </p>
                    {activeFiltersCount > 0 && (
                        <Button variant="secondary" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productsData.content.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {productsData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSearchParams(prev => ({
                                    ...prev,
                                    page: Math.max(0, prev.page! - 1)
                                }))}
                                disabled={searchParams.page === 0}
                            >
                                Previous
                            </Button>
                            <span className="px-4 py-2 text-sm text-gray-600">
                Page {(searchParams.page || 0) + 1} of {productsData.totalPages}
              </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSearchParams(prev => ({
                                    ...prev,
                                    page: (prev.page || 0) + 1
                                }))}
                                disabled={(searchParams.page || 0) >= productsData.totalPages - 1}
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
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
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

                {product.isOnSale && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
            -{product.discountPercentage}% OFF
          </span>
                )}
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">{product.brandName}</p>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span className="line-clamp-1">{product.category.name}</span>
                </div>

                {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>
                )}

                <div>
          <span className="text-lg font-bold text-gray-900">
            ${product.basePrice.toFixed(2)}
          </span>
                    <p className="text-xs text-gray-600">{product.priceRange}</p>
                </div>

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