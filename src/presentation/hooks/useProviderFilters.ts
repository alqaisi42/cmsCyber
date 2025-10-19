
// File: src/presentation/hooks/useProviderFilters.ts
import { useState, useMemo, useCallback } from 'react';
import { ProviderFilters } from '@/core/types/provider.types';
import { ProviderSummary } from '@/core/entities/ecommerce';

export function useProviderFilters(providers: ProviderSummary[] = []) {
    const [filters, setFilters] = useState<ProviderFilters>({
        search: '',
        status: 'all',
        sortBy: 'name',
        sortOrder: 'asc',
    });

    const filteredProviders = useMemo(() => {
        let result = [...providers];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            result = result.filter(p =>
                filters.status === 'active' ? p.isActive : !p.isActive
            );
        }

        // Rating filter
        if (filters.minRating) {
            result = result.filter(p => (p.rating ?? 0) >= filters.minRating!);
        }

        // Products filter
        if (filters.minProducts) {
            result = result.filter(p =>
                (p.productsCount ?? 0) >= filters.minProducts!
            );
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'rating':
                    comparison = (a.rating ?? 0) - (b.rating ?? 0);
                    break;
                case 'products':
                    comparison = (a.productsCount ?? 0) - (b.productsCount ?? 0);
                    break;
                case 'revenue':
                    comparison = (a.totalRevenue ?? 0) - (b.totalRevenue ?? 0);
                    break;
            }

            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [providers, filters]);

    const updateFilters = useCallback((newFilters: ProviderFilters) => {
        setFilters(newFilters);
    }, []);

    return {
        filters,
        filteredProviders,
        updateFilters,
        totalCount: providers.length,
        filteredCount: filteredProviders.length,
    };
}