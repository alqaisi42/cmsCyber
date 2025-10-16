// src/app/dashboard/products/[productId]/edit/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {useProduct} from "../../../../../presentation/hooks/useProviders";
import {ProductForm} from "../../../../../presentation/components/products/ProductForm";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string;

    if (!productId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    Invalid product reference
                </div>
            </div>
        );
    }

    const { data: product, isLoading } = useProduct(productId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    Product not found
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
                    <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                    <p className="text-gray-600 mt-1">{product.name}</p>
                </div>
            </div>

            <ProductForm
                mode="edit"
                product={product}
            />
        </div>
    );
}