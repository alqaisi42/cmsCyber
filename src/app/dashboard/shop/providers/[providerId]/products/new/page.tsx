'use client';

import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, PackagePlus } from 'lucide-react';
import { useProviderById, useProviders } from '@/presentation/hooks/useShop';
import { ProductForm } from '@/presentation/components/shop/ProductForm';

export default function CreateProviderProductPage() {
    const params = useParams();
    const router = useRouter();
    const providerId = params.providerId as string;

    const { data: provider, isLoading, error } = useProviderById(providerId);
    const { data: providers } = useProviders();

    const providerFromList = providers?.find((item) => item.id === providerId) ?? null;
    const resolvedProvider = provider ?? providerFromList;
    const providerName = resolvedProvider?.name ?? 'this provider';
    const providerIdentifier = resolvedProvider?.id ?? providerId;
    const providerError = error instanceof Error ? error.message : null;
    const showLoadingState = isLoading && !resolvedProvider;

    const handleSuccess = () => {
        router.push(`/dashboard/shop/providers/${providerId}/products`);
    };

    const handleCancel = () => {
        router.back();
    };

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
                {showLoadingState && (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading provider details...
                    </div>
                )}

                {!showLoadingState && providerError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <p className="font-semibold">Unable to load provider information</p>
                            <p>{providerError}</p>
                            {providerFromList && (
                                <p className="mt-2 text-xs text-red-600">
                                    Showing cached provider info. Please double-check before submitting.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {!showLoadingState && (
                    <div className="space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <PackagePlus className="w-6 h-6 text-blue-600" />
                                    Add a product for {providerName}
                                </h1>
                                <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                                    Capture rich product information, attach media assets (including rotation frames), and configure
                                    variant-specific pricing and inventory from a single form.
                                </p>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                                <p>Provider ID</p>
                                <p className="font-semibold text-slate-900">{providerIdentifier}</p>
                            </div>
                        </div>

                        <ProductForm
                            initialProviderId={providerIdentifier}
                            onCancel={handleCancel}
                            onSuccess={handleSuccess}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
