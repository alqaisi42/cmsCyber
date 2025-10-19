'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    Layers,
    Loader2,
    Package,
    Sparkles,
    Star,
} from 'lucide-react';

import type { ShopProvider } from '@/core/entities/ecommerce';
import { ProviderForm, ProviderFormValues } from '@/presentation/components/shop/providers/ProviderForm';
import { useProviderById, useUpdateProvider } from '@/presentation/hooks/useShop';

function mapProviderToFormValues(provider: ShopProvider): ProviderFormValues {
    return {
        name: provider.name,
        logoUrl: provider.logoUrl ?? undefined,
        contactEmail: provider.contactEmail,
        contactPhone: provider.contactPhone ?? undefined,
        website: provider.website ?? undefined,
        description: provider.description ?? undefined,
        businessRegistrationNumber: provider.businessRegistrationNumber ?? undefined,
        taxNumber: provider.taxNumber ?? undefined,
        commissionPercentage: provider.commissionPercentage ?? 0,
        isActive: provider.isActive,
        rating: provider.rating ?? undefined,
        address: {
            street: provider.address?.street ?? '',
            city: provider.address?.city ?? '',
            state: provider.address?.state ?? '',
            postalCode: provider.address?.postalCode ?? '',
            country: provider.address?.country ?? '',
            latitude: provider.address?.latitude ?? undefined,
            longitude: provider.address?.longitude ?? undefined,
        },
    };
}

export default function EditProviderPage({ params }: { params: { providerId: string } }) {
    const router = useRouter();
    const { data: provider, isLoading, error } = useProviderById(params.providerId);
    const updateProvider = useUpdateProvider();
    const [serverError, setServerError] = useState<string | null>(null);

    const handleSubmit = async (values: ProviderFormValues) => {
        setServerError(null);
        try {
            await updateProvider.mutateAsync({ id: params.providerId, data: values });
            router.push('/dashboard/shop/providers');
        } catch (mutationError) {
            if (mutationError instanceof Error) {
                setServerError(mutationError.message);
            } else if (typeof mutationError === 'object' && mutationError !== null && 'message' in mutationError) {
                setServerError(String((mutationError as { message: unknown }).message));
            } else {
                setServerError('We could not update the provider. Please try again.');
            }
        }
    };

    const summaryCards = useMemo(() => {
        if (!provider) return [];
        const ratingValue =
            provider.rating !== null && provider.rating !== undefined
                ? provider.rating.toFixed(2)
                : '—';
        const commissionValue =
            typeof provider.commissionPercentage === 'number'
                ? provider.commissionPercentage.toFixed(2)
                : '—';

        return [
            {
                label: 'Active Products',
                value: provider.activeProductsCount ?? 0,
                icon: Package,
            },
            {
                label: 'Categories',
                value: provider.categoriesCount ?? 0,
                icon: Layers,
            },
            {
                label: 'Rating',
                value: ratingValue,
                icon: Star,
            },
            {
                label: 'Commission %',
                value: commissionValue,
                icon: BadgeCheck,
            },
        ];
    }, [provider]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-24">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-10 text-slate-600 shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <p className="text-sm font-medium">Loading provider details...</p>
                    <p className="text-xs text-slate-400">Please hold on while we prepare the editing workspace.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 px-6 py-24">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-10 text-center text-red-600 shadow-sm">
                    <AlertTriangle className="h-10 w-10" />
                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold">We couldn’t load this provider</h1>
                        <p className="text-sm text-red-500/80">{String(error)}</p>
                    </div>
                    <Link
                        href="/dashboard/shop/providers"
                        className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
                    >
                        Back to provider list
                    </Link>
                </div>
            </div>
        );
    }

    if (!provider) {
        return null;
    }

    const defaultValues = mapProviderToFormValues(provider);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <Link
                            href="/dashboard/shop/providers"
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm transition hover:text-blue-600"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to providers
                        </Link>
                        <span className="hidden text-slate-300 md:inline">/</span>
                        <span className="hidden text-slate-400 md:inline">Edit provider</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                            <Sparkles className="h-4 w-4" />
                            Update provider profile
                        </div>
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">{provider.name}</h1>
                                <p className="text-sm text-slate-600">
                                    Refresh contact details, legal information, and commission rules for this provider.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span className={`h-2 w-2 rounded-full ${provider.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {provider.isActive ? 'Active Provider' : 'Inactive Provider'}
                            </div>
                        </div>
                    </div>

                    {summaryCards.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {summaryCards.map((card) => (
                                <div
                                    key={card.label}
                                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                                >
                                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            {card.label}
                                        </p>
                                        <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                <ProviderForm
                    mode="edit"
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    isSubmitting={updateProvider.isPending}
                    serverError={serverError}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
