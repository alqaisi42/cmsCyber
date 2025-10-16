// src/app/dashboard/providers/[providerId]/page.tsx
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Edit,
    Package,
    Plus,
    ShoppingBag,
    Star,
    TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useProvider, useProviderProducts } from '../../../../presentation/hooks/useProviders';
import { Button, Card, CardBody, CardFooter, CardHeader } from '../../../../presentation/components/ui';
import type { Product } from '../../../../core/entities';

export default function ProviderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params?.providerId as string;

    const { data: provider, isLoading, error } = useProvider(providerId);
    const { data: productsData } = useProviderProducts(providerId, 0, 6);

    const topProducts = useMemo(() => productsData?.content || [], [productsData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    Failed to load provider details.
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt={provider.name} className="w-full h-full object-cover" />
                        ) : (
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                provider.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                            >
                                {provider.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-gray-600 mt-1">Joined {formatDate(provider.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        leftIcon={<Edit className="w-4 h-4" />}
                        onClick={() => router.push(`/dashboard/providers/${providerId}/edit`)}
                    >
                        Edit Provider
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => router.push(`/dashboard/providers/${providerId}/products`)}
                    >
                        Manage Products
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Products"
                    value={provider.totalProducts}
                    icon={<Package className="w-5 h-5" />}
                    description="Products published by this provider"
                />
                <StatCard
                    title="In Stock"
                    value={provider.productsInStock}
                    icon={<ShoppingBag className="w-5 h-5" />}
                    description="Products currently available"
                    accent="bg-green-50 border border-green-100"
                />
                <StatCard
                    title="Average Price"
                    value={`$${provider.averagePrice.toFixed(2)}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    description="Average selling price"
                />
                <StatCard
                    title="Rating"
                    value={provider.rating.toFixed(1)}
                    icon={<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                    description="Customer satisfaction"
                />
            </div>

            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Recent Products</h2>
                            <p className="text-sm text-gray-500">Latest additions from this provider</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => router.push(`/dashboard/providers/${providerId}/products`)}
                        >
                            View all products
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    {topProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No products found for this provider yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {topProducts.map((product) => (
                                <ProductSummaryCard key={product.id} product={product} onView={() => router.push(`/dashboard/products/${product.id}/variants`)} />
                            ))}
                        </div>
                    )}
                </CardBody>
                <CardFooter className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing {topProducts.length} of {productsData?.totalElements || 0} products
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => router.push(`/dashboard/products/new?providerId=${providerId}`)}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Add Product
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    description,
    accent,
}: {
    title: string;
    value: string | number;
    icon: ReactNode;
    description: string;
    accent?: string;
}) {
    return (
        <div className={`bg-white rounded-xl shadow-sm p-6 flex items-start gap-4 ${accent || ''}`}>
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    );
}

function ProductSummaryCard({ product, onView }: { product: Product; onView: () => void }) {
    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.primaryImageUrl ? (
                        <img src={product.primaryImageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.category?.name}</p>
                </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{product.availableSizes.length} sizes</span>
                <span>{product.availableColors.length} colors</span>
                <span>{product.isOnSale ? 'On Sale' : 'Regular'}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">${product.basePrice.toFixed(2)}</span>
                <Button variant="secondary" size="sm" onClick={onView}>
                    Manage variants
                </Button>
            </div>
        </div>
    );
}

function formatDate(date: string) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
}
