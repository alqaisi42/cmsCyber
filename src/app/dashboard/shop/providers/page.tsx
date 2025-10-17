'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Search, Filter, Plus, TrendingUp } from 'lucide-react';
import { ProviderCard } from '../../../../presentation/components/shop/ProviderCard';
import {useProviders} from "../../../../presentation/hooks/useShop";

export default function ProvidersPage() {
    const router = useRouter();
    const { data: providers, isLoading, error } = useProviders();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterActive, setFilterActive] = useState<boolean | null>(null);

    const filteredProviders = providers?.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterActive === null || provider.isActive === filterActive;
        return matchesSearch && matchesFilter;
    });

    const stats = providers ? {
        total: providers.length,
        active: providers.filter(p => p.isActive).length,
        totalProducts: providers.reduce((sum, p) => sum + p.totalProducts, 0),
        avgRating: (providers.reduce((sum, p) => sum + p.rating, 0) / providers.length).toFixed(1)
    } : null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 font-bold">Error loading providers</p>
                    <p className="text-sm text-slate-600 mt-2">{String(error)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Store className="w-8 h-8 text-blue-600" />
                            Provider Management
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Manage your product providers and suppliers
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                        <Plus className="w-5 h-5" />
                        Add Provider
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Total Providers</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Active Providers</p>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Total Products</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Average Rating</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.avgRating}</p>
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search providers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterActive(null)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filterActive === null
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterActive(true)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filterActive === true
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilterActive(false)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filterActive === false
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Inactive
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Providers Grid */}
            {filteredProviders && filteredProviders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProviders.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            onViewProducts={(id) => router.push(`/dashboard/shop/providers/${id}/products`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
                    <Store className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No providers found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
