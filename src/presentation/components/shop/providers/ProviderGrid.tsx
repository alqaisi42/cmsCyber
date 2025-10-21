// File: src/presentation/components/shop/providers/ProviderGrid.tsx
import { ProviderCard } from './ProviderCard';
import { ProviderCardSkeleton } from './ProviderCardSkeleton';
import { ProviderSummary } from '@/core/entities/ecommerce';
import { ProviderMetrics } from '@/core/types/provider.types';
import { Store } from 'lucide-react';

interface ProviderGridProps {
    providers: ProviderSummary[];
    metrics?: Record<string, ProviderMetrics>;
    isLoading?: boolean;
    onViewDetails: (id: string) => void;
    onEdit?: (id: string) => void;
    onToggleStatus?: (id: string) => void;
    onManageCategories?: (id: string) => void;
    variant?: 'default' | 'compact' | 'detailed';
    selectedIds?: string[];
    emptyMessage?: string;
}

export function ProviderGrid({
                                 providers,
                                 metrics = {},
                                 isLoading = false,
                                 onViewDetails,
                                 onEdit,
                                 onToggleStatus,
                                 onManageCategories,
                                 variant = 'default',
                                 selectedIds = [],
                                 emptyMessage = "No providers found"
                             }: ProviderGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <ProviderCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!providers || providers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border-2 border-dashed border-slate-300">
                <Store className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium text-lg">{emptyMessage}</p>
                <p className="text-sm text-slate-500 mt-2">
                    Try adjusting your filters or add new providers
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {providers.map((provider) => (
                <ProviderCard
                    key={provider.id}
                    provider={provider}
                    metrics={metrics[provider.id]}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onManageCategories={onManageCategories}
                    variant={variant}
                    isSelected={selectedIds.includes(provider.id)}
                />
            ))}
        </div>
    );
}