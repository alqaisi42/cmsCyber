// src/app/dashboard/categories/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Layers,
    Plus,
    Search,
    Edit,
    Trash2,
    FolderPlus,
    RefreshCw,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from '../../../presentation/hooks/useCategories';
import { Badge, Button, Modal } from '../../../presentation/components/ui';
import { Category } from '../../../core/entities';
import { cn } from '../../../shared/utils/cn';

interface CategoryModalState {
    mode: 'create' | 'edit';
    category?: Category;
    parent?: Category;
}

const DEFAULT_FORM: Partial<Category> = {
    name: '',
    code: '',
    description: '',
    iconUrl: '',
    displayOrder: 0,
    isActive: true,
};

export default function CategoriesPage() {
    const { data: categories, isLoading, error, refetch } = useCategories();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState<CategoryModalState | null>(null);

    const sanitizedCategories = useMemo(() => {
        if (!categories) return [] as Category[];

        const sanitize = (items: Category[]): Category[] =>
            items
                .filter((item) => Boolean(item?.id))
                .map((item) => ({
                    ...item,
                    subcategories: item.subcategories ? sanitize(item.subcategories as Category[]) : [],
                }));

        return sanitize(categories);
    }, [categories]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return sanitizedCategories;
        const query = searchQuery.toLowerCase();

        const filterTree = (items: Category[]): Category[] => {
            return items
                .map((item) => {
                    const subcategories = item.subcategories ? filterTree(item.subcategories as Category[]) : [];
                    const matches =
                        item.name.toLowerCase().includes(query) ||
                        item.code.toLowerCase().includes(query) ||
                        (item.description || '').toLowerCase().includes(query);

                    if (matches || subcategories.length > 0) {
                        return { ...item, subcategories };
                    }
                    return null;
                })
                .filter(Boolean) as Category[];
        };

        return filterTree(sanitizedCategories);
    }, [sanitizedCategories, searchQuery]);

    const totalCategories = sanitizedCategories.length;
    const totalSubcategories = useMemo(() => {
        const countSubs = (items: Category[]): number =>
            items.reduce((sum, item) => sum + (item.subcategories?.length || 0) + countSubs(item.subcategories || []), 0);

        return countSubs(sanitizedCategories);
    }, [sanitizedCategories]);

    const activeCategories = useMemo(() => {
        const countActive = (items: Category[]): number =>
            items.reduce(
                (sum, item) =>
                    sum + (item.isActive ? 1 : 0) + countActive((item.subcategories as Category[]) || []),
                0,
            );

        return countActive(sanitizedCategories);
    }, [sanitizedCategories]);

    const handleDelete = async (category: Category) => {
        if (!window.confirm(`Delete category "${category.name}"?`)) return;

        try {
            await deleteCategory.mutateAsync(category.id);
            alert('Category deleted successfully');
        } catch (err: any) {
            alert(err.message || 'Failed to delete category');
        }
    };

    const handleSubmit = async (form: Partial<Category>) => {
        if (!modalState) return;

        try {
            if (modalState.mode === 'create') {
                await createCategory.mutateAsync({
                    parentId: modalState.parent?.id,
                    data: form,
                });
                alert(
                    modalState.parent
                        ? 'Subcategory created successfully'
                        : 'Category created successfully',
                );
            } else if (modalState.category) {
                await updateCategory.mutateAsync({ id: modalState.category.id, data: form });
                alert('Category updated successfully');
            }
            setModalState(null);
        } catch (err: any) {
            alert(err.message || 'Failed to save category');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600 mt-1">
                        Organize and manage categories, subcategories, and navigation structure
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                        onClick={() => refetch()}
                        isLoading={isLoading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setModalState({ mode: 'create' })}
                    >
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search categories by name, code, or description..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Categories"
                    value={totalCategories}
                    icon={<Layers className="w-5 h-5" />}
                    accent="bg-blue-100 text-blue-700"
                />
                <StatCard
                    title="Total Subcategories"
                    value={totalSubcategories}
                    icon={<FolderPlus className="w-5 h-5" />}
                    accent="bg-purple-100 text-purple-700"
                />
                <StatCard
                    title="Active"
                    value={activeCategories}
                    icon={<Plus className="w-5 h-5" />}
                    accent="bg-green-100 text-green-700"
                />
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    Failed to load categories
                </div>
            ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6 animate-pulse space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-2/3" />
                            <div className="h-4 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-24 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        {searchQuery
                            ? 'Try adjusting your search terms or clear the filter to see all categories.'
                            : 'Create your first category to begin organizing products.'}
                    </p>
                    <div className="mt-6">
                        <Button variant="primary" onClick={() => setModalState({ mode: 'create' })}>
                            Create Category
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredCategories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            onAddSubcategory={(parent) => setModalState({ mode: 'create', parent })}
                            onEdit={(category) => setModalState({ mode: 'edit', category })}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <CategoryModal
                state={modalState}
                onClose={() => setModalState(null)}
                onSubmit={handleSubmit}
                isSubmitting={createCategory.isPending || updateCategory.isPending}
            />
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    accent,
}: {
    title: string;
    value: number | string;
    icon: ReactNode;
    accent: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', accent)}>{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function CategoryCard({
    category,
    onAddSubcategory,
    onEdit,
    onDelete,
}: {
    category: Category;
    onAddSubcategory: (category: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}) {
    const subcategories = (category.subcategories as Category[])?.filter((item) => Boolean(item?.id)) || [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                            <Badge variant={category.isActive ? 'success' : 'danger'} size="sm">
                                {category.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Code: {category.code}</p>
                        {category.parentName && (
                            <p className="text-sm text-gray-500">Parent: {category.parentName}</p>
                        )}
                        {category.description && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{category.description}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEdit(category)}
                            leftIcon={<Edit className="w-4 h-4" />}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(category)}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                        >
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <InfoItem label="Display Order" value={category.displayOrder ?? 0} />
                    <InfoItem label="Products" value={category.productCount ?? 0} />
                    {category.iconUrl && <InfoItem label="Icon" value={category.iconUrl} isLink />}
                    <InfoItem label="Created" value={formatDate(category.createdAt)} />
                    {category.updatedAt && <InfoItem label="Updated" value={formatDate(category.updatedAt)} />}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Subcategories ({subcategories.length})
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => onAddSubcategory(category)}
                        >
                            Add Subcategory
                        </Button>
                    </div>

                    {subcategories.length === 0 ? (
                        <p className="text-sm text-gray-500">No subcategories yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {subcategories.map((subcategory) => (
                                <div
                                    key={subcategory.id}
                                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-gray-900">{subcategory.name}</p>
                                            <Badge variant={subcategory.isActive ? 'success' : 'danger'} size="sm">
                                                {subcategory.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">Code: {subcategory.code}</p>
                                        {subcategory.description && (
                                            <p className="text-xs text-gray-500 mt-1">{subcategory.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onAddSubcategory(subcategory)}
                                            leftIcon={<FolderPlus className="w-4 h-4" />}
                                        >
                                            Nest
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => onEdit(subcategory)}
                                            leftIcon={<Edit className="w-4 h-4" />}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onDelete(subcategory)}
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoItem({
    label,
    value,
    isLink = false,
}: {
    label: string;
    value: string | number;
    isLink?: boolean;
}) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return (
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            {isLink ? (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 break-all"
                >
                    View icon
                </a>
            ) : (
                <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
            )}
        </div>
    );
}

function CategoryModal({
    state,
    onClose,
    onSubmit,
    isSubmitting,
}: {
    state: CategoryModalState | null;
    onClose: () => void;
    onSubmit: (form: Partial<Category>) => Promise<void>;
    isSubmitting: boolean;
}) {
    const [formState, setFormState] = useState<Partial<Category>>(DEFAULT_FORM);

    const isOpen = Boolean(state);
    const mode = state?.mode ?? 'create';
    const title = mode === 'create' ? 'Create Category' : 'Edit Category';

    const parentName = state?.parent?.name;

    useEffect(() => {
        if (!state) {
            setFormState(DEFAULT_FORM);
            return;
        }

        if (state.mode === 'edit' && state.category) {
            setFormState({
                name: state.category.name,
                code: state.category.code,
                description: state.category.description,
                iconUrl: state.category.iconUrl,
                displayOrder: state.category.displayOrder,
                isActive: state.category.isActive,
            });
        } else {
            setFormState({
                ...DEFAULT_FORM,
                displayOrder: (state.parent?.displayOrder ?? 0) + 1,
            });
        }
    }, [state]);

    const handleChange = (field: keyof Category, value: any) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const payload: Partial<Category> = {
            name: formState.name?.trim() || '',
            code: formState.code?.trim() || '',
            description: formState.description?.trim() || '',
            iconUrl: formState.iconUrl?.trim() || '',
            displayOrder: Number(formState.displayOrder ?? 0),
            isActive: formState.isActive ?? true,
        };

        if (!payload.name || !payload.code) {
            alert('Name and code are required');
            return;
        }

        await onSubmit(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {parentName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                        Creating subcategory under <strong>{parentName}</strong>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formState.name || ''}
                            onChange={(event) => handleChange('name', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Category name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formState.code || ''}
                            onChange={(event) => handleChange('code', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Unique code"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                            type="number"
                            value={formState.displayOrder ?? 0}
                            onChange={(event) => handleChange('displayOrder', Number(event.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                        <input
                            type="url"
                            value={formState.iconUrl || ''}
                            onChange={(event) => handleChange('iconUrl', event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={formState.description || ''}
                        onChange={(event) => handleChange('description', event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Describe this category"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formState.isActive ?? true}
                        onChange={(event) => handleChange('isActive', event.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Category is active
                    </label>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        {mode === 'create' ? 'Create' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function formatDate(date?: string | Date) {
    if (!date) return '—';
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
}
