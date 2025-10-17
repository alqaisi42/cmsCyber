// src/presentation/providers/QueryProvider.tsx
// React Query setup for the entire app

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Create a client
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Prevent refetching on window focus in development
                        refetchOnWindowFocus: false,
                        // Retry failed requests once
                        retry: 1,
                        // Cache data for 5 minutes
                        staleTime: 5 * 60 * 1000,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* DevTools - only shows in development */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}