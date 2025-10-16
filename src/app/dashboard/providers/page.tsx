// src/app/dashboard/providers/page.tsx
'use client';

import { Store, Search, Plus, Edit, Trash2, Package, Star, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {useDeleteProvider, useProviders} from "../../../presentation/hooks/useProviders";
import {Button} from "../../../presentation/components/ui";
import { useState} from "react";
import {Provider} from "../../../core/entities";

export default function ProvidersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: providers, isLoading, error } = useProviders();
    const deleteProvider = useDeleteProvider();

    const filteredProviders = providers?.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete provider "${name}"?`)) {
            try {
                await deleteProvider.mutateAsync(id);
                alert('Provider deleted successfully');
            } catch (error) {
                alert('Failed to delete provider');
            }
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-lg text-gray-700">Failed to load providers</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Providers Management</h1>
                    <p className="text-gray-600 mt-1">Manage all providers and their products</p>
                </div>
                <Link href="/dashboard/providers/new">
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                        Add Provider
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search providers by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Providers"
                    value={providers?.length || 0}
                    icon={Store}
                    color="blue"
                    loading={isLoading}
                />
                <StatCard
                    title="Active Providers"
                    value={providers?.filter(p => p.isActive).length || 0}
                    icon={TrendingUp}
                    color="green"
                    loading={isLoading}
                />
                <StatCard
                    title="Total Products"
                    value={providers?.reduce((sum, p) => sum + p.totalProducts, 0) || 0}
                    icon={Package}
                    color="purple"
                    loading={isLoading}
                />
                <StatCard
                    title="Avg Rating"
                    value={providers?.length ? (providers.reduce((sum, p) => sum + p.rating, 0) / providers.length).toFixed(1) : '0'}
                    icon={Star}
                    color="yellow"
                    loading={isLoading}
                />
            </div>

            {/* Providers Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                            <div className="h-16 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : filteredProviders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
                    <p className="text-gray-600">
                        {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first provider'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProviders.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, loading }: {
    title: string;
    value: number | string;
    icon: any;
    color: 'blue' | 'green' | 'purple' | 'yellow';
    loading: boolean;
}) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        yellow: 'bg-yellow-100 text-yellow-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    {loading ? (
                        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function ProviderCard({ provider, onDelete }: {
    provider: Provider;
    onDelete: (id: string, name: string) => void;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
            {/* Provider Logo & Name */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt={provider.name} className="w-full h-full object-cover" />
                        ) : (
                            <Store className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-gray-600">{provider.rating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    provider.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
          {provider.isActive ? 'Active' : 'Inactive'}
        </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
                <div>
                    <p className="text-xs text-gray-600">Total Products</p>
                    <p className="text-lg font-bold text-gray-900">{provider.totalProducts}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-600">In Stock</p>
                    <p className="text-lg font-bold text-green-600">{provider.productsInStock}</p>
                </div>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-600">Average Price</p>
                <p className="text-lg font-bold text-blue-600">${provider.averagePrice.toFixed(2)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Link href={`/dashboard/providers/${provider.id}/products`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                        <Package className="w-4 h-4 mr-1" />
                        View Products
                    </Button>
                </Link>
                <Link href={`/dashboard/providers/${provider.id}/edit`}>
                    <Button variant="secondary" size="sm">
                        <Edit className="w-4 h-4" />
                    </Button>
                </Link>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(provider.id, provider.name)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}