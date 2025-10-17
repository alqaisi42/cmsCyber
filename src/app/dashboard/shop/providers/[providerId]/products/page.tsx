// src/app/dashboard/shop/providers/[providerId]/products/page.tsx
// DEBUG VERSION - Add console logs to see what's being returned

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Package, DollarSign, Star, Tag, Eye,
    Edit, Trash2, Image as ImageIcon, Box
} from 'lucide-react';
import { useProvider, useProviderProducts } from '../../../../../../presentation/hooks/useShop';

export default function ProviderProductsPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    const { data: provider } = useProvider(providerId);
    const { data: productsResponse, isLoading, error } = useProviderProducts(providerId, currentPage, pageSize);

    // 🔍 DEBUG: Log what we're getting
    useEffect(() => {
        console.log('🔍 DEBUG - productsResponse:', productsResponse);
        console.log('🔍 Type of productsResponse:', typeof productsResponse);
        console.log('🔍 productsResponse?.data:', productsResponse?.data);
        console.log('🔍 productsResponse?.total:', productsResponse?.total);
        console.log('🔍 productsResponse?.totalPages:', productsResponse?.totalPages);

        if (productsResponse) {
            console.log('🔍 Keys in productsResponse:', Object.keys(productsResponse));
        }
    }, [productsResponse]);

    // Try to extract data safely
    const products = productsResponse?.data || [];
    const totalPages = productsResponse?.totalPages || 0;
    const totalElements = productsResponse?.total || 0;

    console.log('✅ Final extracted values:');
    console.log('  - products length:', products.length);
    console.log('  - totalPages:', totalPages);
    console.log('  - totalElements:', totalElements);

    const handleAddProduct = () => {
        router.push(`/dashboard/shop/products/new?providerId=${providerId}`);
    };

    const handleViewProduct = (productId: string) => {
        router.push(`/dashboard/shop/products/${productId}`);
    };

    const handleEditProduct = (productId: string) => {
        router.push(`/dashboard/shop/products/${productId}/edit`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600">
                    <p className="font-bold">Error loading products</p>
                    <p className="text-sm mt-2">{String(error)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Debug Info Banner */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-mono text-yellow-800">
                    🔍 DEBUG: productsResponse type = {typeof productsResponse} |
                    Has data? {productsResponse?.data ? 'YES' : 'NO'} |
                    Products count: {products.length}
                </p>
            </div>

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Providers
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {provider?.name || 'Provider'} Products
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Manage products from this provider
                        </p>
                    </div>
                    <button
                        onClick={handleAddProduct}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats */}
            {provider && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Products</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {provider.totalProducts}
                                </p>
                            </div>
                            <Package className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Stock</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {provider.productsInStock}
                                </p>
                            </div>
                            <Box className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Average Price</p>
                                <p className="text-2xl font-bold text-purple-600 mt-1">
                                    ${provider.averagePrice.toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Rating</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                    {provider.rating.toFixed(1)}
                                </p>
                            </div>
                            <Star className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Price Range
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Rating
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {products.map((product: any) => (
                            <tr key={product.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        {product.primaryImageUrl ? (
                                            <img
                                                src={product.primaryImageUrl}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-900">{product.name}</p>
                                            {product.brandName && (
                                                <p className="text-sm text-slate-500">{product.brandName}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-600">
                                            {product.category?.name || 'N/A'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {product.priceRange || `$${product.basePrice?.toFixed(2) || '0.00'}`}
                                        </p>
                                        {product.isOnSale && product.discountPercentage > 0 && (
                                            <span className="inline-flex items-center text-xs text-red-600">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                {product.discountPercentage}% OFF
                                                </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`text-sm font-medium ${
                                                product.totalStock > 50
                                                    ? 'text-green-600'
                                                    : product.totalStock > 10
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                            }`}
                                        >
                                            {product.totalStock || 0}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-sm text-slate-600">
                                                {product.rating?.toFixed(1) || '0.0'}
                                            </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.status === 'OUT_OF_STOCK'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-slate-100 text-slate-800'
                                            }`}
                                        >
                                            {product.status || 'UNKNOWN'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleViewProduct(product.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEditProduct(product.id)}
                                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing {currentPage * pageSize + 1} to{' '}
                            {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} products
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {products.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No products found for this provider</p>
                        <button
                            onClick={handleAddProduct}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add First Product
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}