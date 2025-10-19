// src/app/dashboard/shop/providers/[providerId]/products/new/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, PackagePlus, Store } from 'lucide-react';
import { useProviderById, useProviders } from '@/presentation/hooks/useShop';
import { EnhancedProductForm } from '@/presentation/components/shop/EnhancedProductForm';
import React, { useState, useEffect } from 'react';

export default function CreateProviderProductPage() {
    const params = useParams();
    const router = useRouter();
    const urlProviderId = params.providerId as string;

    // Check if the URL provider ID is a placeholder
    const isUrlPlaceholder = !urlProviderId ||
        urlProviderId === 'undefined' ||
        urlProviderId === '11111111-1111-1111-1111-111111111111' ||
        urlProviderId.includes('1111');

    // Use state for selected provider
    const [selectedProviderId, setSelectedProviderId] = useState(
        isUrlPlaceholder ? '' : urlProviderId
    );

    // Fetch all providers
    const { data: allProviders, isLoading: loadingProviders } = useProviders();

    // Only fetch specific provider if we have a valid ID
    const {
        data: provider,
        isLoading: loadingProvider,
        error
    } = useProviderById(selectedProviderId, {
        enabled: !!selectedProviderId && selectedProviderId !== ''
    });

    // Find provider from list as fallback
    const providerFromList = React.useMemo(() => {
        if (!selectedProviderId || !allProviders) return null;
        return allProviders.find(p => p.id === selectedProviderId);
    }, [selectedProviderId, allProviders]);

    // Use provider from fetch or from list
    const activeProvider = provider || providerFromList;

    // Update selected provider when URL changes (browser navigation)
    useEffect(() => {
        if (!isUrlPlaceholder && urlProviderId !== selectedProviderId) {
            setSelectedProviderId(urlProviderId);
        }
    }, [urlProviderId, isUrlPlaceholder, selectedProviderId]);

    const handleSuccess = () => {
        router.push(`/dashboard/shop/providers/${selectedProviderId}/products`);
    };

    const handleCancel = () => {
        if (selectedProviderId) {
            router.push(`/dashboard/shop/providers/${selectedProviderId}/products`);
        } else {
            router.push('/dashboard/shop/providers');
        }
    };

    const handleProviderSelect = (newProviderId: string) => {
        setSelectedProviderId(newProviderId);
    };

    // Determine what to show
    const hasValidSelection = selectedProviderId && selectedProviderId !== '';
    const isLoading = loadingProviders || (hasValidSelection && loadingProvider && !providerFromList);
    const showProviderSelector = !hasValidSelection || (!isLoading && !activeProvider && !loadingProviders);
    const showForm = hasValidSelection && !isLoading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Navigation Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <button
                        onClick={() => router.push('/dashboard/shop/providers')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Providers
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            CREATE PRODUCT
                        </span>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Page Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <PackagePlus className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Create New Product</h1>
                                {activeProvider && (
                                    <p className="text-blue-100 mt-1">
                                        for {activeProvider.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <p className="text-blue-100 mt-4 max-w-2xl">
                            Build comprehensive product listings with multiple variants, pricing options,
                            and immersive 360° image galleries.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                                ✨ Multiple Variants
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                                🎯 360° Views
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                                📦 Inventory Tracking
                            </span>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                                <p className="text-slate-600 font-medium">Loading provider details...</p>
                                <p className="text-sm text-slate-500 mt-2">Please wait a moment</p>
                            </div>
                        )}

                        {/* Provider Selection */}
                        {showProviderSelector && !isLoading && (
                            <div className="space-y-6">
                                <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <AlertCircle className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-amber-900 text-lg">
                                                Select a Provider
                                            </h3>
                                            <p className="text-amber-700 mt-1">
                                                Choose the provider for whom you want to create this product.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {allProviders && allProviders.length > 0 ? (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            Available Providers
                                        </label>
                                        <select
                                            value={selectedProviderId}
                                            onChange={(e) => handleProviderSelect(e.target.value)}
                                            className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Choose a provider...</option>
                                            {allProviders.map((prov) => (
                                                <option key={prov.id} value={prov.id}>
                                                    {prov.name} {!prov.isActive && '(Inactive)'}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Select a provider from the dropdown to continue with product creation.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-600 font-medium">No providers available</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            Please create a provider first before adding products.
                                        </p>
                                        <button
                                            onClick={() => router.push('/dashboard/shop/providers/new')}
                                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Create Provider
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product Form */}
                        {showForm && (
                            <div className="animate-fadeIn">
                                {activeProvider && (
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-900">
                                                    Creating product for:
                                                </p>
                                                <p className="text-lg font-semibold text-blue-800 mt-1">
                                                    {activeProvider.name}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedProviderId('')}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Change Provider
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <EnhancedProductForm
                                    initialProviderId={selectedProviderId}
                                    onCancel={handleCancel}
                                    onSuccess={handleSuccess}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}