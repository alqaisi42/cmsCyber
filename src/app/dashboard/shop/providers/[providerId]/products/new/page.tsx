// src/app/dashboard/shop/providers/[providerId]/products/new/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, PackagePlus, Store } from 'lucide-react';
import { useProviderById, useProviders } from '@/presentation/hooks/useShop';
import { EnhancedProductForm } from '@/presentation/components/shop/EnhancedProductForm';
// Fallback to original if enhanced not available
// import { ProductForm } from '@/presentation/components/shop/ProductForm';
import { useState } from 'react';

export default function CreateProviderProductPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;
    const [selectedProviderId, setSelectedProviderId] = useState(providerId);

    const { data: provider, isLoading, error } = useProviderById(selectedProviderId);
    const { data: allProviders } = useProviders();

    const handleSuccess = () => {
        router.push(`/dashboard/shop/providers/${selectedProviderId}/products`);
    };

    const handleCancel = () => {
        router.back();
    };

    const handleProviderSelect = (newProviderId: string) => {
        setSelectedProviderId(newProviderId);
        // Update the URL to reflect the new provider
        router.replace(`/dashboard/shop/providers/${newProviderId}/products/new`);
    };

    // Check if the provider ID looks like a placeholder
    const isPlaceholderProvider = providerId === '11111111-1111-1111-1111-111111111111' ||
        providerId.includes('1111') ||
        !providerId ||
        providerId === 'undefined';

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to products
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Create product</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {isLoading && !isPlaceholderProvider && (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading provider details...
                    </div>
                )}

                {/* Show provider selection if no valid provider or error */}
                {(error || isPlaceholderProvider) && allProviders && allProviders.length > 0 && (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-amber-900">Provider Selection Required</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        {isPlaceholderProvider
                                            ? 'Please select a valid provider to create a product.'
                                            : 'The specified provider was not found. Please select a different provider.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Select Provider
                            </label>
                            <select
                                value={selectedProviderId}
                                onChange={(e) => handleProviderSelect(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Choose a provider...</option>
                                {allProviders.map((prov) => (
                                    <option key={prov.id} value={prov.id}>
                                        {prov.name} {prov.isActive ? '' : '(Inactive)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Show alternative navigation options */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => router.push('/dashboard/shop/providers')}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Store className="w-4 h-4" />
                                Go to Providers List
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Show error if no providers available */}
                {(error || isPlaceholderProvider) && (!allProviders || allProviders.length === 0) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-red-900">No Providers Available</p>
                                <p className="text-sm text-red-700 mt-1">
                                    You need to create a provider before you can add products.
                                </p>
                                <button
                                    onClick={() => router.push('/dashboard/shop/providers')}
                                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                    Go to Providers
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show form when provider is loaded successfully */}
                {!isLoading && provider && !error && (
                    <div className="space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <PackagePlus className="w-6 h-6 text-blue-600" />
                                    Add a product for {provider.name}
                                </h1>
                                <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                                    Create rich product listings with variant management and 360° image support.
                                    Upload multiple 360° rotation images at once and easily reorder them for smooth rotation views.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        ✨ Bulk 360° Upload
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        🎯 Simple Reordering
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        🎨 Variant Association
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Provider</p>
                                <p className="font-semibold text-slate-900">{provider.name}</p>
                                <p className="text-xs text-slate-500 mt-1">ID: {provider.id}</p>
                            </div>
                        </div>

                        <EnhancedProductForm
                            initialProviderId={provider.id}
                            onCancel={handleCancel}
                            onSuccess={handleSuccess}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}