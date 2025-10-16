// src/app/dashboard/products/[productId]/variants/[variantId]/edit/page.tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import {useProduct, useProductVariant} from "../../../../../../../presentation/hooks/useProviders";
import {ProductVariantForm} from "../../../../../../../presentation/components/products/ProductVariantForm";


export default function EditProductVariantPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string;
    const variantId = params?.variantId as string;

    if (!productId || !variantId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    Invalid variant reference.
                </div>
            </div>
        );
    }

    const { data: product, isLoading: productLoading } = useProduct(productId);
    const { data: variant, isLoading: variantLoading } = useProductVariant(productId, variantId);

    if (productLoading || variantLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!variant) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    Variant not found.
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
                    <h1 className="text-3xl font-bold text-gray-900">Edit Variant</h1>
                    {product && <p className="text-gray-600 mt-1">{product.name}</p>}
                </div>
            </div>

            <ProductVariantForm mode="edit" productId={productId} variant={variant} />
        </div>
    );
}
