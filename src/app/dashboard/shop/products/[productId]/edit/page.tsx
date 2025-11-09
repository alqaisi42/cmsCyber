'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Package } from 'lucide-react';

import { useProductDetails } from '@/presentation/hooks/useProductDetails';
import { ProductUpdateForm } from '@/presentation/components/shop/ProductUpdateForm';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const { product, images, isLoading, error } = useProductDetails(productId);

    const pageTitle = useMemo(() => {
        if (!product) {
            return 'Edit product';
        }
        return `Edit ${product.name}`;
    }, [product]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4 text-slate-600">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm font-medium">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-red-900">Unable to load product</h2>
                    <p className="mt-2 text-sm text-red-700">
                        {error instanceof Error ? error.message : 'The product could not be retrieved at this time.'}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-3">
                                    <Package className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Shop · Product</p>
                                    <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
                                    <p className="text-sm text-slate-600">
                                        Provider: {product.provider?.name ?? 'Unknown'} · Category: {product.category?.name ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                {product.is360Enabled ? '360° enabled' : '360° disabled'}
                            </span>
                        </div>
                    </div>

                    <ProductUpdateForm
                        product={product}
                        images={images}
                        onCancel={() => router.back()}
                        onSuccess={() => router.push(`/dashboard/shop/products/${product.id}`)}
                    />
                </div>
            </div>
        </div>
    );
}
