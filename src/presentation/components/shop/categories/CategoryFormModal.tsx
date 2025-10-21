'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';

type CategoryFormMode = 'create-root' | 'create-child' | 'edit';

export interface CategoryFormValues {
    name: string;
    code?: string;
    description?: string;
    iconUrl?: string;
    parentId?: string | null;
    displayOrder: number;
    isActive?: boolean;
}

interface ParentOption {
    value: string | null;
    label: string;
}

interface CategoryFormModalProps {
    open: boolean;
    mode: CategoryFormMode;
    title: string;
    description: string;
    initialValues?: Partial<CategoryFormValues>;
    parentOptions?: ParentOption[];
    parentLocked?: boolean;
    onSubmit: (values: CategoryFormValues) => Promise<void> | void;
    onClose: () => void;
    submitting?: boolean;
    error?: string | null;
}

const createSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be 100 characters or less'),
    code: z
        .string({ required_error: 'Code is required' })
        .min(2, 'Code must be at least 2 characters')
        .max(100, 'Code must be 100 characters or less')
        .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
    description: z
        .string()
        .max(500, 'Description must be 500 characters or less')
        .optional()
        .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
    iconUrl: z
        .string()
        .url('Enter a valid URL')
        .optional()
        .or(z.literal(''))
        .transform((value) => (value && value.length > 0 ? value : undefined)),
    parentId: z
        .string()
        .uuid({ message: 'Parent category is invalid' })
        .optional()
        .or(z.literal(''))
        .transform((value) => (value && value.length > 0 ? value : undefined)),
    displayOrder: z.coerce.number().min(0, 'Display order must be zero or greater'),
});

const updateSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be 100 characters or less'),
    description: z
        .string()
        .max(500, 'Description must be 500 characters or less')
        .optional()
        .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
    iconUrl: z
        .string()
        .url('Enter a valid URL')
        .optional()
        .or(z.literal(''))
        .transform((value) => (value && value.length > 0 ? value : undefined)),
    parentId: z
        .string()
        .uuid({ message: 'Parent category is invalid' })
        .optional()
        .or(z.literal(''))
        .transform((value) => (value && value.length > 0 ? value : undefined)),
    displayOrder: z.coerce.number().min(0, 'Display order must be zero or greater'),
    isActive: z.boolean().default(true),
});

export function CategoryFormModal({
    open,
    mode,
    title,
    description,
    initialValues,
    parentOptions,
    parentLocked,
    onSubmit,
    onClose,
    submitting,
    error,
}: CategoryFormModalProps) {
    const schema = useMemo(() => (mode === 'edit' ? updateSchema : createSchema), [mode]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialValues?.name ?? '',
            code: initialValues?.code ?? '',
            description: initialValues?.description ?? '',
            iconUrl: initialValues?.iconUrl ?? '',
            parentId: initialValues?.parentId ?? undefined,
            displayOrder: initialValues?.displayOrder ?? 0,
            isActive: initialValues?.isActive ?? true,
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: initialValues?.name ?? '',
                code: initialValues?.code ?? '',
                description: initialValues?.description ?? '',
                iconUrl: initialValues?.iconUrl ?? '',
                parentId: initialValues?.parentId ?? undefined,
                displayOrder: initialValues?.displayOrder ?? 0,
                isActive: initialValues?.isActive ?? true,
            });
        }
    }, [initialValues, open, reset]);

    if (!open) {
        return null;
    }

    const showCodeField = mode !== 'edit';
    const showActiveToggle = mode === 'edit';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                    aria-label="Close"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-8 pb-6 pt-8">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{mode === 'edit' ? 'Update category' : 'Create category'}</p>
                        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                        <p className="text-sm text-slate-600">{description}</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit(async (values) => {
                        await onSubmit({
                            ...values,
                            parentId: values.parentId ?? null,
                            code: values.code ?? initialValues?.code,
                        });
                    })}
                    className="space-y-6 px-8 pb-8 pt-6"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="category-name">
                                Category name
                            </label>
                            <input
                                id="category-name"
                                type="text"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                    errors.name ? 'border-red-400' : 'border-slate-200'
                                }`}
                                placeholder="e.g. Electronics"
                                {...register('name')}
                            />
                            {errors.name && <p className="text-xs font-medium text-red-500">{errors.name.message}</p>}
                        </div>

                        {showCodeField ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="category-code">
                                    Category code
                                </label>
                                <input
                                    id="category-code"
                                    type="text"
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                        errors.code ? 'border-red-400' : 'border-slate-200'
                                    }`}
                                    placeholder="e.g. electronics"
                                    {...register('code')}
                                />
                                <p className="text-xs text-slate-400">Use lowercase letters, numbers, and hyphens.</p>
                                {errors.code && <p className="text-xs font-medium text-red-500">{errors.code.message}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Category code</label>
                                <input
                                    type="text"
                                    disabled
                                    value={initialValues?.code ?? ''}
                                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                                />
                                <p className="text-xs text-slate-400">Codes are immutable after creation.</p>
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="category-description">
                                Description
                            </label>
                            <textarea
                                id="category-description"
                                rows={3}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                    errors.description ? 'border-red-400' : 'border-slate-200'
                                }`}
                                placeholder="Add a short description to help other admins"
                                {...register('description')}
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-400">Keep it under 500 characters.</p>
                                {errors.description && <p className="text-xs font-medium text-red-500">{errors.description.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="category-icon">
                                Icon URL
                            </label>
                            <input
                                id="category-icon"
                                type="url"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                    errors.iconUrl ? 'border-red-400' : 'border-slate-200'
                                }`}
                                placeholder="https://cdn.yourstore.com/icons/icon.png"
                                {...register('iconUrl')}
                            />
                            {errors.iconUrl && <p className="text-xs font-medium text-red-500">{errors.iconUrl.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="display-order">
                                Display order
                            </label>
                            <input
                                id="display-order"
                                type="number"
                                min={0}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                    errors.displayOrder ? 'border-red-400' : 'border-slate-200'
                                }`}
                                placeholder="0"
                                {...register('displayOrder', { valueAsNumber: true })}
                            />
                            <p className="text-xs text-slate-400">Lower numbers appear first in navigation.</p>
                            {errors.displayOrder && <p className="text-xs font-medium text-red-500">{errors.displayOrder.message}</p>}
                        </div>

                        {parentOptions ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="parent-category">
                                    Parent category
                                </label>
                                <select
                                    id="parent-category"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
                                    disabled={parentLocked}
                                    {...register('parentId')}
                                >
                                    {parentOptions.map((option) => (
                                        <option key={option.value ?? 'root'} value={option.value ?? ''}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {parentLocked ? (
                                    <p className="text-xs text-slate-400">Parent category is pre-selected for subcategories.</p>
                                ) : (
                                    <p className="text-xs text-slate-400">Choose "No parent" to keep this as a root category.</p>
                                )}
                                {errors.parentId && <p className="text-xs font-medium text-red-500">{errors.parentId.message}</p>}
                            </div>
                        ) : null}

                        {showActiveToggle ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <label className="inline-flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        {...register('isActive')}
                                    />
                                    <span className="text-sm text-slate-600">Keep this category active</span>
                                </label>
                            </div>
                        ) : null}
                    </div>

                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            <span>{mode === 'edit' ? 'Save changes' : 'Create category'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CategoryFormModal.displayName = 'CategoryFormModal';
