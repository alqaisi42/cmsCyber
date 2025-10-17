// =============================================================================
// File: src/app/dashboard/shop/providers/[providerId]/products/page.tsx
// FIXED - Products List Page with Variants Support
// =============================================================================

'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package,
    Search,
    Plus,
    Grid,
    List,
    Eye,
    Edit,
    AlertCircle,
    Palette
} from 'lucide-react';
import type {
    ShopProduct,
    ProductVariant,
} from '../../../../../../core/entities/ecommerce';
import { useProviderProducts, useProviderById, useProductVariants } from '../../../../../../presentation/hooks/useShop';
import { Modal } from '../../../../../../presentation/components/ui/Modal';
import { Image360Viewer } from '../../../../../../presentation/components/shop/Image360Viewer';
import { collectVariantMedia } from '../../../../../../presentation/utils/variantMedia';

type ProviderProduct = ShopProduct & {
    imageUrl?: string | null;
    stockQuantity?: number | null;
    totalVariants?: number | null;
    thumbnailUrl?: string | null;
};

export default function ProviderProductsPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<ProviderProduct | null>(null);
    const pageSize = 12;

    // Fetch provider info and products
    const { data: provider } = useProviderById(providerId);
    const { data: productsResponse, isLoading, error } = useProviderProducts(
        providerId,
        currentPage,
        pageSize
    );

    const products = useMemo<ProviderProduct[]>(
        () => (productsResponse?.data as ProviderProduct[]) ?? [],
        [productsResponse?.data]
    );

    // Filter products by search
    const filteredProducts = useMemo(
        () =>
            products.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [products, searchQuery]
    );

    const totalPages = productsResponse?.totalPages ?? 0;
    const totalProducts = productsResponse?.total ?? products.length;

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
                            {totalProducts} products available
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
                {products.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Total Products</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {totalProducts}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">In Stock</p>
                            <p className="text-2xl font-bold text-green-600">
                                {products.filter((p) => (p.totalStock ?? 0) > 0).length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Low Stock</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {products.filter((p) => {
                                    const stock = p.totalStock ?? 0;
                                    return stock > 0 && stock <= 10;
                                }).length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">
                                {products.filter((p) => (p.totalStock ?? 0) === 0).length}
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
                                onViewVariants={() => setSelectedProduct(product)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-slate-700">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
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

            <ProductVariantsModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
}

// =============================================================================
// Product Card Component
// =============================================================================

interface ProductCardProps {
    product: ProviderProduct;
    viewMode: 'grid' | 'list';
    onView: () => void;
    onEdit: () => void;
    onViewVariants: () => void;
}

const STOCK_STATUS = {
    OUT: { label: 'Out of Stock', badge: 'bg-red-100 text-red-700' },
    LOW: { label: 'Low Stock', badge: 'bg-yellow-100 text-yellow-700' },
    IN: { label: 'In Stock', badge: 'bg-green-100 text-green-700' },
} as const;

function resolveStockStatus(stockQuantity: number) {
    if (stockQuantity === 0) return STOCK_STATUS.OUT;
    if (stockQuantity <= 10) return STOCK_STATUS.LOW;
    return STOCK_STATUS.IN;
}

function getProductImage(product: ProviderProduct): string | null {
    return (
        product.imageUrl ||
        product.primaryImageUrl ||
        product.thumbnailUrl ||
        null
    );
}

function ProductCard({ product, viewMode, onView, onEdit, onViewVariants }: ProductCardProps) {
    const stockQuantity = product.totalStock ?? product.stockQuantity ?? 0;
    const basePrice = product.basePrice ?? 0;
    const hasVariants = (product.totalVariants ?? 0) > 0;
    const stockStatus = resolveStockStatus(stockQuantity);
    const imageUrl = getProductImage(product);

    const VariantsButton = (
        <button
            onClick={onViewVariants}
            className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
        >
            <Palette className="w-4 h-4" />
            Variants
            {hasVariants && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-semibold">
                    {product.totalVariants}
                </span>
            )}
        </button>
    );

    if (viewMode === 'list') {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-8 h-8 text-slate-400" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate flex-1">
                                {product.name}
                            </h3>
                            {hasVariants && (
                                <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium whitespace-nowrap">
                                    {product.totalVariants} variants
                                </span>
                            )}
                        </div>

                        {product.brandName && (
                            <p className="text-xs text-slate-500 mb-1">{product.brandName}</p>
                        )}

                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {product.description}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-lg font-bold text-blue-600">
                                ${basePrice.toFixed(2)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.badge}`}>
                                {stockStatus.label}
                            </span>
                            <span className="text-sm text-slate-600">
                                Stock: {stockQuantity}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {VariantsButton}
                        <div className="flex gap-2">
                            <button
                                onClick={onView}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="View product"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onEdit}
                                className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"
                                title="Edit product"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package className="w-16 h-16 text-slate-400" />
                )}
            </div>

            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1">
                        {product.name}
                    </h3>
                    {hasVariants && (
                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium whitespace-nowrap">
                            {product.totalVariants} variants
                        </span>
                    )}
                </div>

                <p className="text-sm text-slate-600 line-clamp-2">
                    {product.description}
                </p>

                <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">
                        ${basePrice.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.badge}`}>
                        {stockStatus.label}
                    </span>
                </div>

                <div className="text-sm text-slate-600">Stock: {stockQuantity} units</div>

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

                {VariantsButton}
            </div>
        </div>
    );
}

interface ProductVariantsModalProps {
    product: ProviderProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

function ProductVariantsModal({ product, isOpen, onClose }: ProductVariantsModalProps) {
    const productId = product?.id ?? '';
    const { data, isLoading, isError, error } = useProductVariants(productId);

    const variants = useMemo<ProductVariant[]>(
        () => (data?.data as ProductVariant[]) ?? [],
        [data?.data]
    );

    if (!product) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${product.name} Variants`}
            size="xl"
        >
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4" />
                    Loading variants...
                </div>
            )}

            {isError && !isLoading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {(error as Error)?.message || 'Unable to load product variants.'}
                </div>
            )}

            {!isLoading && !isError && variants.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                    No variants found for this product.
                </div>
            )}

            {!isLoading && !isError && variants.length > 0 && (
                <div className="space-y-6">
                    {variants.map((variant) => (
                        <VariantPanel key={variant.id} variant={variant} />
                    ))}
                </div>
            )}
        </Modal>
    );
}

function VariantPanel({ variant }: { variant: ProductVariant }) {
    const { allImages, rotationImages, total, has360 } = collectVariantMedia(variant);
    const shouldShow360 = rotationImages.length > 1 || (has360 && rotationImages.length > 0);
    const fallbackImages = rotationImages.length > 0 ? rotationImages : allImages;
    const hasImages = fallbackImages.length > 0;
    const stockStatus = resolveStockStatus(variant.stockQuantity);
    const computedPrice = typeof (variant as any).price === 'number'
        ? (variant as any).price
        : variant.basePrice + (variant.priceAdjustment ?? 0);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-1/2">
                    {shouldShow360 && rotationImages.length > 0 ? (
                        <Image360Viewer images={rotationImages} autoPlay={false} className="max-h-[22rem]" />
                    ) : hasImages ? (
                        <div className="overflow-hidden rounded-lg bg-slate-100">
                            <img
                                src={fallbackImages[0].imageUrl}
                                alt={`${variant.sku} preview`}
                                className="w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex h-56 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            No images available
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-slate-900">SKU: {variant.sku}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-600">
                            Size {variant.size}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                            {variant.color}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs font-medium ${stockStatus.badge}`}>
                            {stockStatus.label}
                        </span>
                    </div>

                    <div className="text-sm text-slate-700">
                        <span className="font-medium">Price:</span>{' '}
                        ${computedPrice.toFixed(2)}
                        {variant.priceAdjustment !== 0 && (
                            <span className="ml-2 text-xs text-slate-500">
                                (Base ${variant.basePrice.toFixed(2)} {variant.priceAdjustment >= 0 ? '+' : '-'} ${Math.abs(variant.priceAdjustment).toFixed(2)})
                            </span>
                        )}
                    </div>

                    <div className="text-sm text-slate-700">
                        <span className="font-medium">Stock:</span>{' '}
                        {variant.stockQuantity} units
                        {variant.lowStockThreshold > 0 && (
                            <span className={`ml-2 text-xs font-medium ${variant.stockQuantity <= variant.lowStockThreshold ? 'text-red-600' : 'text-slate-500'}`}>
                                Low stock threshold: {variant.lowStockThreshold}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <div>
                            <span className="font-medium">Availability:</span>{' '}
                            {variant.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                        {variant.barcode && (
                            <div>
                                <span className="font-medium">Barcode:</span>{' '}
                                {variant.barcode}
                            </div>
                        )}
                        {variant.inStockNo && (
                            <div>
                                <span className="font-medium">Inventory #:</span>{' '}
                                {variant.inStockNo}
                            </div>
                        )}
                        {variant.weight !== undefined && variant.weight !== null && (
                            <div>
                                <span className="font-medium">Weight:</span>{' '}
                                {variant.weight} g
                            </div>
                        )}
                    </div>

                    {total > 0 ? (
                        <p className="text-xs text-slate-500">
                            Showing {shouldShow360 ? '360° rotation' : 'primary'} media ({total} image{total !== 1 ? 's' : ''}).
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

