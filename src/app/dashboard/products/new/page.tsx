// src/app/dashboard/products/new/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {ProductForm} from "../../../../presentation/components/products/ProductForm";

export default function NewProductPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const providerId = searchParams.get('providerId');

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
                    <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
                    <p className="text-gray-600 mt-1">Add a new product to your catalog</p>
                </div>
            </div>

            <ProductForm
                mode="create"
                providerId={providerId || undefined}
            />
        </div>
    );
}
