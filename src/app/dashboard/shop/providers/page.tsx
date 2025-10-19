
// File: src/app/dashboard/shop/providers/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {Store, Plus, Download, Upload, Settings, AlertCircle, Star, Package} from 'lucide-react';
import { useProviders, useToggleProviderStatus } from '@/presentation/hooks/useShop';
import { useProviderFilters } from '@/presentation/hooks/useProviderFilters';
import { ProviderGrid } from '@/presentation/components/shop/providers/ProviderGrid';
import { ProviderFiltersBar } from '@/presentation/components/shop/providers/ProviderFiltersBar';
import {StatsCard} from "@/presentation/components/ui/StatsCard";

export default function EnhancedProvidersPage() {
    const router = useRouter();
    const { data: providers, isLoading, error } = useProviders();
    const toggleStatusMutation = useToggleProviderStatus();

    const {
        filters,
        filteredProviders,
        updateFilters,
        totalCount,
        filteredCount,
    } = useProviderFilters(providers || []);

    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'default' | 'compact' | 'detailed'>('default');

    // Calculate statistics
    const stats = providers ? {
        total: providers.length,
        active: providers.filter(p => p.isActive).length,
        totalProducts: providers.reduce((sum, p) => sum + (p.productsCount ?? 0), 0),
        avgRating: providers.length > 0
            ? (providers.reduce((sum, p) => sum + (p.rating ?? 0), 0) / providers.length).toFixed(1)
            : '0.0',
        lowStock: providers.filter(p => (p.activeProductsCount ?? 0) < ((p.productsCount ?? 0) * 0.2)).length,
    } : null;

    const handleViewDetails = useCallback((id: string) => {
        router.push(`/dashboard/shop/providers/${id}/products`);
    }, [router]);

    const handleEdit = useCallback((id: string) => {
        router.push(`/dashboard/shop/providers/${id}/edit`);
    }, [router]);

    const handleToggleStatus = useCallback(async (id: string) => {
        try {
            await toggleStatusMutation.mutateAsync({ id });
        } catch (error) {
            console.error('Failed to toggle provider status:', error);
        }
    }, [toggleStatusMutation]);

    const handleExport = useCallback(() => {
        // Implement export functionality
        console.log('Exporting providers...');
    }, []);

    const handleImport = useCallback(() => {
        // Implement import functionality
        console.log('Importing providers...');
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-bold text-lg">Error loading providers</p>
                    <p className="text-sm text-slate-600 mt-2">{String(error)}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Store className="w-8 h-8 text-blue-600" />
                            </div>
                            Provider Management
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Manage your suppliers and their product catalogs
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard/shop/providers/import')}
                            className="px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium border border-slate-200 transition-colors"
                        >
                            <Upload className="w-5 h-5" />
                            Import
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/shop/providers/new')}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Provider
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <StatsCard
                            title="Total Providers"
                            value={stats.total}
                            icon={<Store className="w-5 h-5" />}
                            trend={{ value: 12, isPositive: true }}
                            className="bg-white"
                        />
                        <StatsCard
                            title="Active"
                            value={stats.active}
                            icon={<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                            color="green"
                        />
                        <StatsCard
                            title="Total Products"
                            value={stats.totalProducts}
                            icon={<Package className="w-5 h-5" />}
                            color="blue"
                        />
                        <StatsCard
                            title="Avg Rating"
                            value={stats.avgRating}
                            icon={<Star className="w-5 h-5" />}
                            color="yellow"
                        />
                        <StatsCard
                            title="Low Stock"
                            value={stats.lowStock}
                            icon={<AlertCircle className="w-5 h-5" />}
                            color="red"
                            trend={{ value: stats.lowStock, isPositive: false }}
                        />
                    </div>
                )}

                {/* Filters Bar */}
                <ProviderFiltersBar
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onExport={handleExport}
                    onImport={handleImport}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                />
            </div>

            {/* Provider Grid */}
            <ProviderGrid
                providers={filteredProviders}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                variant={viewMode}
                selectedIds={selectedProviders}
            />
        </div>
    );
}