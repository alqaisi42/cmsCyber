// src/app/dashboard/products/[providerId]/variants/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Package,
    AlertTriangle,
    Check,
    X,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import {
    useDeleteProductVariant,
    useProduct,
    useProductVariants
} from "../../../../../../../presentation/hooks/useProviders";
import {Button} from "../../../../../../../presentation/components/ui";
import {ProductVariant} from "../../../../../../../core/entities";

export default function ProductVariantsPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const { data: product, isLoading: productLoading } = useProduct(productId);
    const { data: variants, isLoading: variantsLoading } = useProductVariants(productId);
    const deleteVariant = useDeleteProductVariant();

    const handleDelete = async (variantId: string, sku: string) => {
        if (window.confirm(`Are you sure you want to delete variant "${sku}"?`)) {
            try {
                await deleteVariant.mutateAsync({ productId, variantId });
                alert('Variant deleted successfully');
            } catch (error) {
                alert('Failed to delete variant');
            }
        }
    };

    if (productLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Product Variants</h1>
                    <p className="text-gray-600 mt-1">{product?.name}</p>
                </div>
                <Link href={`/dashboard/products/${productId}/variants/new`}>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                        Add Variant
                    </Button>
                </Link>
            </div>

            {/* Product Summary Card */}
            {product && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {product.primaryImageUrl ? (
                                <img
                                    src={product.primaryImageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-12 h-12 text-gray-300" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Base Price</p>
                                    <p className="text-lg font-semibold text-gray-900">${product.basePrice.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Price Range</p>
                                    <p className="text-lg font-semibold text-gray-900">{product.priceRange}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Stock</p>
                                    <p className="text-lg font-semibold text-gray-900">{product.totalStock}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Variants</p>
                                    <p className="text-lg font-semibold text-gray-900">{variants?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Variants List */}
            {variantsLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : !variants || variants.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No variants yet</h3>
                    <p className="text-gray-600 mb-4">Add your first product variant to get started</p>
                    <Link href={`/dashboard/products/${productId}/variants/new`}>
                        <Button variant="primary">Add First Variant</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {variants.map((variant) => (
                        <VariantCard
                            key={variant.id}
                            variant={variant}
                            productId={productId}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function VariantCard({
                         variant,
                         productId,
                         onDelete
                     }: {
    variant: ProductVariant;
    productId: string;
    onDelete: (variantId: string, sku: string) => void;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-start gap-6">
                {/* Variant Images */}
                <div className="flex gap-2">
                    {variant.images && variant.images.length > 0 ? (
                        variant.images.slice(0, 3).map((image, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={image.imageUrl}
                                    alt={`${variant.sku} - ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))
                    ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                    )}
                </div>

                {/* Variant Details */}
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                SKU: {variant.sku}
                            </h3>
                            <div className="flex items-center gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${
                    variant.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                  {variant.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                                {variant.isLowStock && (
                                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                  </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/dashboard/products/${productId}/variants/${variant.id}/edit`}>
                                <Button variant="secondary" size="sm">
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => onDelete(variant.id, variant.sku)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Variant Specifications Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Size</p>
                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-sm font-medium uppercase">
                {variant.size}
              </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Color</p>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-6 h-6 rounded border-2 border-gray-300"
                                    style={{ backgroundColor: variant.color }}
                                    title={variant.color}
                                />
                                <span className="text-sm font-medium capitalize">{variant.color}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Base Price</p>
                            <p className="text-sm font-semibold text-gray-900">${variant.basePrice.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Price Adjustment</p>
                            <p className={`text-sm font-semibold ${
                                variant.priceAdjustment > 0 ? 'text-green-600' :
                                    variant.priceAdjustment < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                                {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Final Price</p>
                            <p className="text-lg font-bold text-blue-600">${variant.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Stock</p>
                            <p className={`text-sm font-semibold ${
                                variant.stockQuantity === 0 ? 'text-red-600' :
                                    variant.isLowStock ? 'text-orange-600' : 'text-green-600'
                            }`}>
                                {variant.stockQuantity} units
                            </p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t border-gray-100">
                        <div>
                            <span className="font-medium">Barcode:</span> {variant.barcode}
                        </div>
                        <div>
                            <span className="font-medium">Weight:</span> {variant.weight}g
                        </div>
                        <div>
                            <span className="font-medium">Stock No:</span> {variant.inStockNo}
                        </div>
                        <div>
                            <span className="font-medium">Low Stock Threshold:</span> {variant.lowStockThreshold}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}