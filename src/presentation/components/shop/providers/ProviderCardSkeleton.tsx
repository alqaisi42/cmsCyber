
// File: src/presentation/components/shop/providers/ProviderCardSkeleton.tsx
import { Skeleton } from '@/presentation/components/ui/Skeleton';

export function ProviderCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
            </div>

            <Skeleton className="h-10 rounded-lg" />
        </div>
    );
}