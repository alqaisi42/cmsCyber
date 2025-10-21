// File: src/presentation/components/shop/providers/ProviderCard.tsx
import { memo } from 'react';
import {
    Store,
    Star,
    Package,
    TrendingUp,
    MoreVertical,
    Eye,
    Edit,
    Pause,
    Play,
    DollarSign,
    Clock,
    RotateCcw,
    Users,
    FolderTree,
} from 'lucide-react';
import { ProviderSummary } from '@/core/entities/ecommerce';

import {ProviderMetrics} from "@/core/types/provider.types";
import {cn, formatCurrency, formatNumber} from "@/shared/utils/cn";

interface ProviderCardProps {
    provider: ProviderSummary;
    metrics?: ProviderMetrics;
    onViewDetails: (id: string) => void;
    onEdit?: (id: string) => void;
    onToggleStatus?: (id: string) => void;
    onManageCategories?: (id: string) => void;
    variant?: 'default' | 'compact' | 'detailed';
    isSelected?: boolean;
}

export const ProviderCard = memo(function ProviderCard({
                                                           provider,
                                                           metrics,
                                                           onViewDetails,
                                                           onEdit,
                                                           onToggleStatus,
                                                           onManageCategories,
                                                           variant = 'default',
                                                           isSelected = false
                                                       }: ProviderCardProps) {
    const rating = provider.rating ?? 0;
    const totalProducts = provider.productsCount ?? provider.activeProductsCount ?? 0;
    const activeProducts = provider.activeProductsCount ?? provider.productsCount ?? 0;
    const averagePrice = provider.averageProductPrice ?? 0;
    const commission = provider.commissionPercentage ?? 0;
    const revenue = provider.totalRevenue ?? null;

    const handleCardClick = () => {
        onViewDetails(provider.id);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <article
            className={cn(
                "group relative bg-white rounded-xl border transition-all duration-200",
                "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
                isSelected && "ring-2 ring-blue-500 shadow-lg",
                provider.isActive ? "border-slate-200" : "border-red-200 opacity-90"
            )}
            onClick={handleCardClick}
            role="article"
            aria-label={`Provider: ${provider.name}`}
        >
            {/* Status Badge */}
            <div className="absolute -top-2 -right-2 z-10">
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                "shadow-sm border",
                provider.isActive
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
            )}
        >
          {provider.isActive ? (
              <>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Active
              </>
          ) : (
              <>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />
                  Inactive
              </>
          )}
        </span>
            </div>

            {/* Header Section */}
            <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                    {/* Logo/Avatar */}
                    <div className="relative flex-shrink-0">
                        {provider.logoUrl ? (
                            <img
                                src={provider.logoUrl}
                                alt={`${provider.name} logo`}
                                className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-100"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                                <Store className="w-7 h-7 text-white" />
                            </div>
                        )}
                        {/* Rating Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-lg px-1.5 py-0.5 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-semibold text-slate-700">
                  {rating.toFixed(1)}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg truncate">
                            {provider.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            ID: {provider.id.slice(0, 8)}
                        </p>
                    </div>

                    {/* Action Menu */}
                    <div className="flex-shrink-0" onClick={handleMenuClick}>
                        <button
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            aria-label="Provider options"
                        >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                    {/* Products Metric */}
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-500">Products</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">
                            {formatNumber(totalProducts)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Active: {formatNumber(activeProducts)}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-500">Commission</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">
                            {commission.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Avg price: {formatCurrency(averagePrice)}
                        </p>
                    </div>
                </div>

                {/* Extended Metrics (if available) */}
                {(metrics || revenue !== null) && variant === 'detailed' && (
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
                        {metrics ? (
                            <>
                                <MetricBadge
                                    icon={<Users className="w-3 h-3" />}
                                    value={metrics.orderCount30Days}
                                    label="Orders"
                                />
                                <MetricBadge
                                    icon={<Clock className="w-3 h-3" />}
                                    value={`${metrics.avgFulfillmentTime}h`}
                                    label="Fulfill"
                                />
                                <MetricBadge
                                    icon={<RotateCcw className="w-3 h-3" />}
                                    value={`${metrics.returnRate}%`}
                                    label="Returns"
                                />
                                <MetricBadge
                                    icon={<Star className="w-3 h-3" />}
                                    value={metrics.customerSatisfaction.toFixed(1)}
                                    label="CSAT"
                                />
                            </>
                        ) : (
                            <MetricBadge
                                icon={<TrendingUp className="w-3 h-3" />}
                                value={revenue ? formatCurrency(revenue) : '—'}
                                label="Revenue"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                    {onManageCategories && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onManageCategories(provider.id);
                            }}
                            className={cn(
                                'flex-1 min-w-[150px] px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                'bg-white text-slate-700 border border-slate-200',
                                'hover:border-blue-200 hover:text-blue-600 flex items-center justify-center gap-2'
                            )}
                            aria-label="Manage provider categories"
                        >
                            <FolderTree className="w-4 h-4" />
                            Manage Categories
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(provider.id);
                        }}
                        className={cn(
                            'flex-1 min-w-[150px] px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                            'bg-blue-600 text-white flex items-center justify-center gap-2',
                            'hover:bg-blue-700'
                        )}
                    >
                        <Eye className="w-4 h-4" />
                        View Products
                    </button>
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(provider.id);
                            }}
                            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                            aria-label="Edit provider"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {onToggleStatus && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(provider.id);
                            }}
                            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                            aria-label={provider.isActive ? "Pause provider" : "Activate provider"}
                        >
                            {provider.isActive ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-b-xl" />
        </article>
    );
});

// Sub-component for metric badges
function MetricBadge({
                         icon,
                         value,
                         label
                     }: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
}) {
    return (
        <div className="text-center">
            <div className="flex items-center justify-center text-slate-400 mb-1">
                {icon}
            </div>
            <p className="text-sm font-semibold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}