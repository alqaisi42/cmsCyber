'use client';

import { Store, Star, Package, DollarSign, TrendingUp } from 'lucide-react';
import { ProviderStatsResponse } from '../../../core/entities/ecommerce';

interface ProviderCardProps {
    provider: ProviderStatsResponse;
    onViewProducts: (id: string) => void;
}

export function ProviderCard({ provider, onViewProducts }: ProviderCardProps) {
    // ✅ FIX: Safe handling of potentially null/undefined values
    const rating = provider.rating ?? 0;
    const averagePrice = provider.averagePrice ?? 0;
    const totalProducts = provider.totalProducts ?? 0;
    const productsInStock = provider.productsInStock ?? 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    {provider.logoUrl ? (
                        <img
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="w-16 h-16 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Store className="w-8 h-8 text-blue-600" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{provider.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {/* ✅ FIX: Safe toFixed() call */}
                            <span className="text-sm font-medium text-slate-700">
                {rating.toFixed(1)}
              </span>
                        </div>
                    </div>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                        provider.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                >
          {provider.isActive ? 'Active' : 'Inactive'}
        </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Package className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
                    <p className="text-xs text-slate-600">Products</p>
                </div>
                <div className="text-center border-x border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{productsInStock}</p>
                    <p className="text-xs text-slate-600">In Stock</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                    </div>
                    {/* ✅ FIX: Safe toFixed() call */}
                    <p className="text-2xl font-bold text-slate-900">
                        ${averagePrice.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-600">Avg Price</p>
                </div>
            </div>

            <button
                onClick={() => onViewProducts(provider.id)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
                View Products
            </button>
        </div>
    );
}