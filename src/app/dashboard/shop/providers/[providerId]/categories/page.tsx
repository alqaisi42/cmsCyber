'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowLeft,
    FolderPlus,
    Layers3,
    Loader2,
    Sparkles,
    TrendingUp,
} from 'lucide-react';

import { ProductCategorySummary } from '@/core/entities/ecommerce';
import {
    useProviderById,
    useProviderCategories,
    useCreateProviderCategory,
    useUpdateProviderCategory,
    useDeleteProviderCategory,
} from '@/presentation/hooks/useShop';
import { CategoryTree } from '@/presentation/components/shop/categories/CategoryTree';
import { CategoryFormModal, CategoryFormValues } from '@/presentation/components/shop/categories/CategoryFormModal';
import { DeleteCategoryDialog } from '@/presentation/components/shop/categories/DeleteCategoryDialog';

function flattenCategories(categories: ProductCategorySummary[]): ProductCategorySummary[] {
    const result: ProductCategorySummary[] = [];

    const traverse = (nodes: ProductCategorySummary[]) => {
        nodes.forEach((node) => {
            result.push(node);
            if (node.subcategories && node.subcategories.length > 0) {
                traverse(node.subcategories);
            }
        });
    };

    traverse(categories);
    return result;
}

function collectDescendantIds(category: ProductCategorySummary): Set<string> {
    const ids = new Set<string>();
    const traverse = (node: ProductCategorySummary) => {
        ids.add(node.id);
        node.subcategories?.forEach(traverse);
    };
    traverse(category);
    return ids;
}

export default function ProviderCategoriesPage({ params }: { params: { providerId: string } }) {
    const router = useRouter();
    const providerId = params.providerId;
    const [activeOnly, setActiveOnly] = useState<boolean>(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [formState, setFormState] = useState<
        | null
        | {
              mode: 'create-root' | 'create-child' | 'edit';
              category?: ProductCategorySummary;
              parent?: ProductCategorySummary;
          }
    >(null);
    const [deleteState, setDeleteState] = useState<{ category: ProductCategorySummary; warning?: string } | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const { data: provider, isLoading: providerLoading, error: providerError } = useProviderById(providerId);
    const {
        data: categories,
        isLoading: categoriesLoading,
        error: categoriesError,
    } = useProviderCategories(providerId, { activeOnly });

    const createCategory = useCreateProviderCategory(providerId);
    const updateCategory = useUpdateProviderCategory(providerId);
    const deleteCategory = useDeleteProviderCategory(providerId);

    const flattened = useMemo(() => (categories ? flattenCategories(categories) : []), [categories]);

    const stats = useMemo(() => {
        if (!flattened || flattened.length === 0) {
            return {
                total: 0,
                active: 0,
                leaf: 0,
            };
        }

        let active = 0;
        let leaf = 0;

        flattened.forEach((category) => {
            if (category.isActive) active += 1;
            if (!category.subcategories || category.subcategories.length === 0) {
                leaf += 1;
            }
        });

        return {
            total: flattened.length,
            active,
            leaf,
        };
    }, [flattened]);

    const parentOptions = useMemo(() => {
        const options = [{ value: null, label: 'No parent (root category)' }];
        flattened.forEach((category) => {
            options.push({ value: category.id, label: category.name });
        });
        return options;
    }, [flattened]);

    const handleToggle = (categoryId: string) => {
        setExpanded((prev) => ({
            ...prev,
            [categoryId]: !(prev[categoryId] ?? true),
        }));
    };

    const handleFormSubmit = async (values: CategoryFormValues) => {
        try {
            setFormError(null);
            if (!formState) return;

            if (formState.mode === 'edit' && formState.category) {
                await updateCategory.mutateAsync({
                    categoryId: formState.category.id,
                    data: {
                        name: values.name,
                        description: values.description,
                        iconUrl: values.iconUrl,
                        parentId: values.parentId ?? null,
                        displayOrder: values.displayOrder,
                        isActive: values.isActive,
                    },
                });
            } else {
                await createCategory.mutateAsync({
                    name: values.name,
                    code: values.code ?? '',
                    description: values.description,
                    iconUrl: values.iconUrl,
                    parentId: values.parentId ?? (formState.parent ? formState.parent.id : null),
                    displayOrder: values.displayOrder,
                });
            }

            setFormState(null);
        } catch (error) {
            if (error instanceof Error) {
                setFormError(error.message);
            } else {
                setFormError('We could not save this category. Please try again.');
            }
        }
    };

    const handleDelete = async () => {
        try {
            setDeleteError(null);
            if (!deleteState) return;

            await deleteCategory.mutateAsync(deleteState.category.id);
            setDeleteState(null);
        } catch (error) {
            if (error instanceof Error) {
                setDeleteError(error.message);
            } else {
                setDeleteError('We could not delete this category. Please try again.');
            }
        }
    };

    if (providerLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-24">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-10 text-slate-600 shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <p className="text-sm font-medium">Loading provider details...</p>
                    <p className="text-xs text-slate-400">Preparing the categories workspace.</p>
                </div>
            </div>
        );
    }

    if (providerError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 px-6 py-24">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-10 text-center text-red-600 shadow-sm">
                    <AlertTriangle className="h-10 w-10" />
                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold">We couldn’t load this provider</h1>
                        <p className="text-sm text-red-500/80">{String(providerError)}</p>
                    </div>
                    <Link
                        href="/dashboard/shop/providers"
                        className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
                    >
                        Back to provider list
                    </Link>
                </div>
            </div>
        );
    }

    if (!provider) {
        return null;
    }

    const categoryForForm = formState?.category ?? undefined;
    const parentForForm = formState?.parent ?? undefined;

    let modalTitle = '';
    let modalDescription = '';
    let modalInitialValues: Partial<CategoryFormValues> | undefined;
    let modalParentOptions = parentOptions;
    let parentLocked = false;

    if (formState) {
        if (formState.mode === 'create-root') {
            modalTitle = 'Create a root category';
            modalDescription = 'Root categories appear as the primary navigation items for this provider.';
            modalParentOptions = [{ value: null, label: 'No parent (root category)' }];
            parentLocked = true;
            modalInitialValues = {
                displayOrder: (categories?.length ?? 0) + 1,
                isActive: true,
            };
        } else if (formState.mode === 'create-child' && parentForForm) {
            modalTitle = `Add a subcategory to ${parentForForm.name}`;
            modalDescription = 'Subcategories help organise the catalogue into intuitive clusters.';
            modalParentOptions = [{ value: parentForForm.id, label: parentForForm.name }];
            parentLocked = true;
            modalInitialValues = {
                parentId: parentForForm.id,
                displayOrder: (parentForForm.subcategories?.length ?? 0) + 1,
                isActive: true,
            };
        } else if (formState.mode === 'edit' && categoryForForm) {
            modalTitle = `Edit ${categoryForForm.name}`;
            modalDescription = 'Update the information, hierarchy, or visibility of this category.';
            parentLocked = false;
            const blockedIds = collectDescendantIds(categoryForForm);
            modalParentOptions = parentOptions.filter((option) => {
                if (!option.value) return true;
                return !blockedIds.has(option.value);
            });
            modalInitialValues = {
                name: categoryForForm.name,
                code: categoryForForm.code,
                description: categoryForForm.description ?? undefined,
                iconUrl: categoryForForm.iconUrl ?? undefined,
                parentId: categoryForForm.parentId ?? null,
                displayOrder: categoryForForm.displayOrder ?? 0,
                isActive: categoryForForm.isActive,
            };
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-10">
            <div className="mx-auto max-w-6xl space-y-10">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm transition hover:text-blue-600"
                            type="button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <span className="hidden text-slate-300 md:inline">/</span>
                        <Link
                            href={`/dashboard/shop/providers/${providerId}/edit`}
                            className="hidden rounded-full bg-white px-3 py-1.5 text-slate-500 shadow-sm transition hover:text-blue-600 md:inline-flex"
                        >
                            Edit provider profile
                        </Link>
                        <span className="hidden text-slate-300 md:inline">/</span>
                        <span className="text-slate-500">Manage categories</span>
                    </div>

                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                            <Sparkles className="h-4 w-4" />
                            Provider catalogue architecture
                        </div>
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-slate-900">Manage categories</h1>
                                <p className="text-sm text-slate-600">
                                    Shape the browsing experience for <span className="font-semibold text-slate-700">{provider.name}</span> by curating intuitive categories and subcategories.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span className={`h-2 w-2 rounded-full ${provider.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {provider.isActive ? 'Active provider' : 'Inactive provider'}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <Layers3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total categories</p>
                                <p className="text-lg font-semibold text-slate-900">{stats.total}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Active categories</p>
                                <p className="text-lg font-semibold text-slate-900">{stats.active}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                <FolderPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Leaf nodes</p>
                                <p className="text-lg font-semibold text-slate-900">{stats.leaf}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Category hierarchy</h2>
                            <p className="text-sm text-slate-500">Craft a meaningful structure and keep your catalogue in sync with the provider strategy.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600">
                                <input
                                    type="checkbox"
                                    checked={activeOnly}
                                    onChange={(event) => setActiveOnly(event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Show active only
                            </label>
                            <button
                                type="button"
                                onClick={() => setFormState({ mode: 'create-root' })}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                            >
                                <FolderPlus className="h-4 w-4" />
                                Add root category
                            </button>
                        </div>
                    </div>

                    {categoriesLoading ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-6 py-16 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Loading categories...</p>
                            <p className="text-xs text-slate-400">Hang tight! We’re organising the hierarchy.</p>
                        </div>
                    ) : categoriesError ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                            <p className="text-sm font-medium">We couldn’t load the categories</p>
                            <p className="text-xs text-red-500/80">{String(categoriesError)}</p>
                        </div>
                    ) : (
                        <CategoryTree
                            categories={categories ?? []}
                            expanded={expanded}
                            onToggle={handleToggle}
                            onAddSubcategory={(category) => setFormState({ mode: 'create-child', parent: category })}
                            onEdit={(category) => setFormState({ mode: 'edit', category })}
                            onDelete={(category) =>
                                setDeleteState({
                                    category,
                                    warning:
                                        category.productCount && category.productCount > 0
                                            ? 'This category currently has products assigned. Make sure they are reassigned before deleting.'
                                            : category.subcategories && category.subcategories.length > 0
                                            ? 'This category has nested subcategories. Delete or move them before deleting this category.'
                                            : undefined,
                                })
                            }
                        />
                    )}
                </div>
            </div>

            <CategoryFormModal
                open={Boolean(formState)}
                mode={formState?.mode ?? 'create-root'}
                title={modalTitle}
                description={modalDescription}
                initialValues={modalInitialValues}
                parentOptions={modalParentOptions}
                parentLocked={parentLocked}
                onSubmit={handleFormSubmit}
                onClose={() => {
                    setFormState(null);
                    setFormError(null);
                }}
                submitting={createCategory.isPending || updateCategory.isPending}
                error={formError}
            />

            <DeleteCategoryDialog
                open={Boolean(deleteState)}
                categoryName={deleteState?.category.name ?? ''}
                warning={deleteState?.warning}
                onConfirm={handleDelete}
                onCancel={() => {
                    setDeleteState(null);
                    setDeleteError(null);
                }}
                deleting={deleteCategory.isPending}
                error={deleteError}
            />
        </div>
    );
}
