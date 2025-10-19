
// File: src/presentation/components/shop/providers/ProviderFiltersBar.tsx
import { useState, useCallback, memo } from 'react';
import {
    Search, Filter, X, ChevronDown,
    SlidersHorizontal, Download, Upload
} from 'lucide-react';
import { ProviderFilters } from '@/core/types/provider.types';
import {cn} from "@/shared/utils/cn";

interface ProviderFiltersBarProps {
    filters: ProviderFilters;
    onFiltersChange: (filters: ProviderFilters) => void;
    onExport?: () => void;
    onImport?: () => void;
    totalCount?: number;
    filteredCount?: number;
}

export const ProviderFiltersBar = memo(function ProviderFiltersBar({
                                                                       filters,
                                                                       onFiltersChange,
                                                                       onExport,
                                                                       onImport,
                                                                       totalCount = 0,
                                                                       filteredCount = 0
                                                                   }: ProviderFiltersBarProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleSearchChange = useCallback((value: string) => {
        onFiltersChange({ ...filters, search: value });
    }, [filters, onFiltersChange]);

    const handleStatusChange = useCallback((status: typeof filters.status) => {
        onFiltersChange({ ...filters, status });
    }, [filters, onFiltersChange]);

    const handleSortChange = useCallback((sortBy: typeof filters.sortBy) => {
        const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc'
            ? 'desc'
            : 'asc';
        onFiltersChange({ ...filters, sortBy, sortOrder });
    }, [filters, onFiltersChange]);

    const handleReset = useCallback(() => {
        onFiltersChange({
            search: '',
            status: 'all',
            sortBy: 'name',
            sortOrder: 'asc',
            minRating: undefined,
            minProducts: undefined,
            categories: []
        });
    }, [onFiltersChange]);

    const hasActiveFilters = filters.search ||
        filters.status !== 'all' ||
        filters.minRating ||
        filters.minProducts ||
        (filters.categories && filters.categories.length > 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
            {/* Main Filter Row */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search providers by name..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {filters.search && (
                        <button
                            onClick={() => handleSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['all', 'active', 'inactive'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={cn(
                                "px-4 py-2 rounded-md font-medium text-sm transition-all",
                                filters.status === status
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Sort Options */}
                <div className="flex gap-2">
                    {(['name', 'rating', 'products', 'revenue'] as const).map((sortBy) => (
                        <button
                            key={sortBy}
                            onClick={() => handleSortChange(sortBy)}
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1",
                                filters.sortBy === sortBy
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                            )}
                        >
                            {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                            {filters.sortBy === sortBy && (
                                <ChevronDown
                                    className={cn(
                                        "w-3 h-3 transition-transform",
                                        filters.sortOrder === 'desc' && "rotate-180"
                                    )}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            showAdvanced
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Advanced
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                        >
                            Reset
                        </button>
                    )}

                    {onExport && (
                        <button
                            onClick={onExport}
                            className="px-3 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showAdvanced && (
                <div className="pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Minimum Rating
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.5"
                                value={filters.minRating || ''}
                                onChange={(e) => onFiltersChange({
                                    ...filters,
                                    minRating: e.target.value ? parseFloat(e.target.value) : undefined
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0.0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Minimum Products
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={filters.minProducts || ''}
                                onChange={(e) => onFiltersChange({
                                    ...filters,
                                    minProducts: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Categories
                            </label>
                            <select
                                multiple
                                value={filters.categories || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    onFiltersChange({ ...filters, categories: selected });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="electronics">Electronics</option>
                                <option value="clothing">Clothing</option>
                                <option value="food">Food & Beverages</option>
                                <option value="home">Home & Garden</option>
                                <option value="beauty">Beauty & Health</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing <span className="font-semibold">{filteredCount}</span> of{' '}
              <span className="font-semibold">{totalCount}</span> providers
          </span>
                    {hasActiveFilters && filteredCount !== totalCount && (
                        <span className="text-blue-600">
              {totalCount - filteredCount} filtered out
            </span>
                    )}
                </div>
            )}
        </div>
    );
});