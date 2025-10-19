
// File: src/presentation/components/ui/StatsCard.tsx
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {cn} from "@/shared/utils/cn";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    className?: string;
}

export function StatsCard({
                              title,
                              value,
                              icon,
                              trend,
                              color = 'default',
                              className
                          }: StatsCardProps) {
    const colorClasses = {
        default: 'bg-white border-slate-200',
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        red: 'bg-red-50 border-red-200',
        purple: 'bg-purple-50 border-purple-200',
    };

    const iconColorClasses = {
        default: 'text-slate-400',
        blue: 'text-blue-500',
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500',
        purple: 'text-purple-500',
    };

    return (
        <div className={cn(
            "relative p-4 rounded-xl border shadow-sm transition-all hover:shadow-md",
            colorClasses[color],
            className
        )}>
            <div className="flex items-start justify-between mb-2">
                <div className={cn("p-2 rounded-lg bg-white/50", iconColorClasses[color])}>
                    {icon}
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        trend.isPositive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    )}>
                        {trend.isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-600 mt-1">{title}</p>
        </div>
    );
}
