// src/app/dashboard/products/[productId]/variants/new/page.tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import {useProduct} from "../../../../../../presentation/hooks/useProviders";
import {ProductVariantForm} from "../../../../../../presentation/components/products/ProductVariantForm";


export default function NewProductVariantPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string;
    const { data: product } = useProduct(productId);

    if (!productId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    Invalid product reference.
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
                    <h1 className="text-3xl font-bold text-gray-900">Add Variant</h1>
                    <p className="text-gray-600 mt-1">
                        {product ? `Create a new variant for ${product.name}.` : 'Define the SKU, pricing, and inventory rules.'}
                    </p>
                </div>
            </div>

            <ProductVariantForm mode="create" productId={productId} />
        </div>
    );
}
