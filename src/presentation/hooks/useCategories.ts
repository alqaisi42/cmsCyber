// src/presentation/hooks/useCategories.ts
// React Query hooks for category management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryRepository } from '../../infrastructure/repositories/product.repository';
import { Category } from '../../core/entities';

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryRepository.getTree(),
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: ['category', id],
        queryFn: () => categoryRepository.getById(id),
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         parentId,
                         data,
                     }: {
            parentId?: string;
            data: Partial<Category>;
        }) =>
            parentId
                ? categoryRepository.createSubcategory(parentId, data)
                : categoryRepository.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (variables.parentId) {
                queryClient.invalidateQueries({ queryKey: ['category', variables.parentId] });
            }
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
            categoryRepository.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['category', variables.id] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => categoryRepository.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}
