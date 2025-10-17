// src/app/dashboard/shop/providers/page.tsx
// FIXED: Handles null values safely

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Store, Star, Package, DollarSign, Eye, Edit, Trash2,
    MoreVertical, Search, Filter, Plus, TrendingUp
} from 'lucide-react';
import { useProviders, useToggleProviderStatus } from '../../../../presentation/hooks/useShop';
import { ProviderStatsResponse } from '../../../../core/entities/ecommerce';

export default function ProvidersPage() {
    const router = useRouter();
    const { data: providers, isLoading, error } = useProviders();
    const toggleStatus = useToggleProviderStatus();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterActive, setFilterActive] = useState<boolean | null>(null);

    const filteredProviders = providers?.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterActive === null || provider.isActive === filterActive;
        return matchesSearch && matchesFilter;
    });

    const handleViewProducts = (providerId: string) => {
        router.push(`/dashboard/shop/providers/${providerId}/products`);
    };

    const handleToggleStatus = async (providerId: string, isActive: boolean) => {
        try {
            await toggleStatus.mutateAsync({ id: providerId, isActive: !isActive });
        } catch (error) {
            console.error('Failed to toggle provider status:', error);
        }
    };

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
                <div className="text-red-600">Error loading providers</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Provider Management</h1>
                    <p className="text-slate-600 mt-1">
                        Manage your product providers and suppliers
                    </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Provider
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search providers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterActive(null)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                                filterActive === null
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterActive(true)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                                filterActive === true
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterActive(false)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                                filterActive === false
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            Inactive
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Providers</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {providers?.length || 0}
                            </p>
                        </div>
                        <Store className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Active</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {providers?.filter(p => p.isActive).length || 0}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Products</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {providers?.reduce((sum, p) => sum + (p.totalProducts || 0), 0) || 0}
                            </p>
                        </div>
                        <Package className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Avg Rating</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">
                                {providers?.length
                                    ? (providers.reduce((sum, p) => sum + (p.rating || 0), 0) / providers.length).toFixed(1)
                                    : '0.0'}
                            </p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProviders?.map((provider) => (
                    <div
                        key={provider.id}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                    >
                        {/* Provider Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {provider.logoUrl ? (
                                    <img
                                        src={provider.logoUrl}
                                        alt={provider.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Store className="w-6 h-6 text-blue-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-slate-900">{provider.name}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-sm text-slate-600">{provider.rating?.toFixed(1) || '0.0'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <button className="p-2 hover:bg-slate-100 rounded-lg">
                                    <MoreVertical className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Products</p>
                                <p className="text-lg font-semibold text-slate-900">
                                    {provider.totalProducts || 0}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-600">In Stock</p>
                                <p className="text-lg font-semibold text-green-600">
                                    {provider.productsInStock || 0}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Avg Price</p>
                                <p className="text-lg font-semibold text-slate-900">
                                    ${provider.averagePrice?.toFixed(0) || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-4">
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    provider.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                            >
                                {provider.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewProducts(provider.id)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                            >
                                <Eye className="w-4 h-4" />
                                View Products
                            </button>
                            <button
                                onClick={() => handleToggleStatus(provider.id, provider.isActive)}
                                className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProviders?.length === 0 && (
                <div className="text-center py-12">
                    <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No providers found</p>
                </div>
            )}
        </div>
    );
}