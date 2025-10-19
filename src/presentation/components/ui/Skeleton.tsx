// File: src/presentation/components/ui/Skeleton.tsx

import {cn} from "@/shared/utils/cn";

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    animation?: 'pulse' | 'wave';
}

export function Skeleton({
                             className,
                             variant = 'rectangular',
                             animation = 'pulse'
                         }: SkeletonProps) {
    return (
        <div
            className={cn(
                "bg-slate-200",
                animation === 'pulse' && "animate-pulse",
                animation === 'wave' && "animate-shimmer",
                variant === 'circular' && "rounded-full",
                variant === 'text' && "rounded h-4",
                className
            )}
        />
    );
}