// src/app/dashboard/shop/providers/[providerId]/products/new/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, PackagePlus, Store } from 'lucide-react';
import { useProviderById, useProviders } from '@/presentation/hooks/useShop';
import { EnhancedProductForm } from '@/presentation/components/shop/EnhancedProductForm';
// Fallback to original if enhanced not available
// import { ProductForm } from '@/presentation/components/shop/ProductForm';
import React, { useState, useEffect, useMemo } from 'react';

export default function CreateProviderProductPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;

    // Check if the provider ID looks like a placeholder
    const isPlaceholderProvider = !providerId ||
        providerId === 'undefined' ||
        providerId === '11111111-1111-1111-1111-111111111111' ||
        providerId.includes('1111');

    // Use state for selected provider, initialize with URL param if valid
    const [selectedProviderId, setSelectedProviderId] = useState(
        isPlaceholderProvider ? '' : providerId
    );

    // Only fetch provider if we have a valid ID
    const { data: provider, isLoading, error } = useProviderById(
        selectedProviderId || ''
    );
    const { data: allProviders } = useProviders();

    // Try to find provider from the providers list if the fetch fails
    const providerFromList = React.useMemo(() => {
        if (!selectedProviderId || !allProviders) return null;
        return allProviders.find(p => p.id === selectedProviderId);
    }, [selectedProviderId, allProviders]);

    // Use provider from fetch or from list
    const activeProvider = provider || providerFromList;

    // Update selected provider when URL changes (browser navigation)
    useEffect(() => {
        if (!isPlaceholderProvider && providerId !== selectedProviderId) {
            setSelectedProviderId(providerId);
        }
    }, [providerId, isPlaceholderProvider]);

    const handleSuccess = () => {
        router.push(`/dashboard/shop/providers/${selectedProviderId}/products`);
    };

    const handleCancel = () => {
        router.back();
    };

    const handleProviderSelect = (newProviderId: string) => {
        if (newProviderId && newProviderId !== '') {
            setSelectedProviderId(newProviderId);
            // Don't navigate, just let the component re-render with the new selection
            // This avoids page reload issues
        }
    };

    // Determine what to show based on state
    const hasValidProvider = selectedProviderId && !isPlaceholderProvider;
    const isLoadingProvider = hasValidProvider && isLoading && !providerFromList; // Don't show loading if we have provider from list
    const needsProviderSelection = !hasValidProvider;

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => router.push('/dashboard/shop/providers')}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to providers
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Create product</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {/* Show loading when fetching selected provider */}
                {isLoadingProvider && (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading provider details...
                    </div>
                )}

                {/* Show provider selection if needed */}
                {needsProviderSelection && !isLoadingProvider && allProviders && allProviders.length > 0 && (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-amber-900">Provider Selection Required</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Please select a provider to create a product.
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
                    </div>
                )}

                {/* Always show form if we have a selected provider ID, even if provider data isn't loaded yet */}
                {selectedProviderId && !isPlaceholderProvider && !isLoadingProvider && (
                    <div className="space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <PackagePlus className="w-6 h-6 text-blue-600" />
                                    Add a new product
                                    {activeProvider && ` for ${activeProvider.name}`}
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
                            {activeProvider && (
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Provider</p>
                                    <p className="font-semibold text-slate-900">{activeProvider.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">ID: {selectedProviderId}</p>
                                </div>
                            )}
                        </div>

                        {/* Always display the form with the selected provider ID */}
                        <EnhancedProductForm
                            initialProviderId={selectedProviderId}
                            onCancel={handleCancel}
                            onSuccess={handleSuccess}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}