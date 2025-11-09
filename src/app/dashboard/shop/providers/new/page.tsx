'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { ProviderForm, ProviderFormValues } from '@/presentation/components/shop/providers/ProviderForm';
import { useCreateProvider } from '@/presentation/hooks/useShop';
import type {
    CreateProviderCommand,
    ProviderDocumentUploads,
} from '@/core/types/provider.types';

export default function NewProviderPage() {
    const router = useRouter();
    const createProvider = useCreateProvider();
    const [serverError, setServerError] = useState<string | null>(null);

    const handleSubmit = async (values: ProviderFormValues) => {
        setServerError(null);
        try {
            const { documents, ...providerValues } = values;

            const payload: CreateProviderCommand['payload'] = {
                name: providerValues.name,
                logoUrl: providerValues.logoUrl || undefined,
                contactEmail: providerValues.contactEmail,
                contactPhone: providerValues.contactPhone || undefined,
                website: providerValues.website || undefined,
                description: providerValues.description || undefined,
                businessRegistrationNumber: providerValues.businessRegistrationNumber || undefined,
                taxNumber: providerValues.taxNumber || undefined,
                address: {
                    street: providerValues.address.street,
                    city: providerValues.address.city,
                    state: providerValues.address.state,
                    postalCode: providerValues.address.postalCode,
                    country: providerValues.address.country,
                    latitude: providerValues.address.latitude ?? undefined,
                    longitude: providerValues.address.longitude ?? undefined,
                },
                commissionPercentage: providerValues.commissionPercentage,
                isActive: providerValues.isActive ?? true,
                reviewStatus: providerValues.reviewStatus,
            };

            const documentUploads: ProviderDocumentUploads = {};
            if (documents) {
                Object.entries(documents).forEach(([key, fileList]) => {
                    if (fileList && fileList.length > 0) {
                        documentUploads[key] = Array.from(fileList);
                    }
                });
            }

            const command: CreateProviderCommand = {
                payload,
                documents: Object.keys(documentUploads).length > 0 ? documentUploads : undefined,
            };

            await createProvider.mutateAsync(command);
            router.push('/dashboard/shop/providers');
        } catch (error) {
            if (error instanceof Error) {
                setServerError(error.message);
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                setServerError(String((error as { message: unknown }).message));
            } else {
                setServerError('We could not create the provider. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Link
                            href="/dashboard/shop/providers"
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm transition hover:text-blue-600"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to providers
                        </Link>
                        <span className="hidden text-slate-300 md:inline">/</span>
                        <span className="hidden text-slate-400 md:inline">Create provider</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                            <Sparkles className="h-4 w-4" />
                            Onboard a new partner
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">Add a new provider</h1>
                        <p className="max-w-2xl text-sm text-slate-600">
                            Capture rich business details so merchandising, logistics, and analytics teams can collaborate
                            with this provider from day one.
                        </p>
                    </div>
                </div>

                <ProviderForm
                    mode="create"
                    onSubmit={handleSubmit}
                    isSubmitting={createProvider.isPending}
                    serverError={serverError}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
