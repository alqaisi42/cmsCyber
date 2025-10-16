// src/app/dashboard/providers/[providerId]/edit/page.tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { ProviderForm } from '../../../../../presentation/components/providers/ProviderForm';
import { useProvider } from '../../../../../presentation/hooks/useProviders';

export default function EditProviderPage() {
    const router = useRouter();
    const params = useParams();
    const providerId = params?.providerId as string;

    const { data: provider, isLoading } = useProvider(providerId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    Provider not found.
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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Provider</h1>
                    <p className="text-gray-600 mt-1">Update provider details and availability.</p>
                </div>
            </div>

            <ProviderForm mode="edit" provider={provider} />
        </div>
    );
}
