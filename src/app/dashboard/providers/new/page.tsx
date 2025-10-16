// src/app/dashboard/providers/new/page.tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ProviderForm } from '../../../../presentation/components/providers/ProviderForm';

export default function NewProviderPage() {
    const router = useRouter();

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
                    <h1 className="text-3xl font-bold text-gray-900">Add Provider</h1>
                    <p className="text-gray-600 mt-1">Onboard a new provider and manage their catalog.</p>
                </div>
            </div>

            <ProviderForm mode="create" />
        </div>
    );
}
