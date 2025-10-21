'use client';

import { useMemo } from 'react';
import { ProductCategorySummary } from '@/core/entities/ecommerce';
import { ChevronDown, ChevronRight, FolderPlus, Pencil, Trash2 } from 'lucide-react';

export interface CategoryTreeProps {
    categories: ProductCategorySummary[];
    expanded: Record<string, boolean>;
    onToggle: (categoryId: string) => void;
    onAddSubcategory: (category: ProductCategorySummary) => void;
    onEdit: (category: ProductCategorySummary) => void;
    onDelete: (category: ProductCategorySummary) => void;
}

function CategoryNode({
    category,
    depth,
    expanded,
    onToggle,
    onAddSubcategory,
    onEdit,
    onDelete,
}: {
    category: ProductCategorySummary;
    depth: number;
    expanded: Record<string, boolean>;
    onToggle: (categoryId: string) => void;
    onAddSubcategory: (category: ProductCategorySummary) => void;
    onEdit: (category: ProductCategorySummary) => void;
    onDelete: (category: ProductCategorySummary) => void;
}) {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expanded[category.id] ?? true;

    const paddingClass = useMemo(() => {
        const base = 'pl-4 sm:pl-6';
        if (depth === 0) return base;
        return `${base} border-l border-slate-200`;
    }, [depth]);

    return (
        <div className="space-y-3">
            <div
                className={`flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md ${paddingClass}`}
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                        <button
                            type="button"
                            onClick={() => (hasChildren ? onToggle(category.id) : undefined)}
                            className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-500 transition ${
                                hasChildren ? 'border-slate-200 hover:border-blue-200 hover:text-blue-600' : 'border-transparent cursor-default'
                            }`}
                            aria-label={hasChildren ? (isExpanded ? 'Collapse category' : 'Expand category') : undefined}
                        >
                            {hasChildren ? (
                                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            ) : (
                                <span className="inline-block h-2 w-2 rounded-full bg-slate-300" aria-hidden />
                            )}
                        </button>

                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                    {category.code}
                                </span>
                                <span className="text-lg font-semibold text-slate-900">{category.name}</span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        category.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {category.description ? (
                                <p className="text-sm text-slate-600">{category.description}</p>
                            ) : null}
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                <span>
                                    Display order: <strong className="text-slate-700">{category.displayOrder ?? 0}</strong>
                                </span>
                                <span>
                                    Products:{' '}
                                    <strong className="text-slate-700">{category.productCount ?? 0}</strong>
                                </span>
                                {category.parentName ? <span>Parent: {category.parentName}</span> : null}
                                {category.updatedAt ? <span>Updated: {new Date(category.updatedAt).toLocaleDateString()}</span> : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onAddSubcategory(category)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                        >
                            <FolderPlus className="h-4 w-4" />
                            Subcategory
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit(category)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(category)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded ? (
                <div className="space-y-3 pl-4 sm:pl-10">
                    {category.subcategories.map((child) => (
                        <CategoryNode
                            key={child.id}
                            category={child}
                            depth={depth + 1}
                            expanded={expanded}
                            onToggle={onToggle}
                            onAddSubcategory={onAddSubcategory}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function CategoryTree({ categories, expanded, onToggle, onAddSubcategory, onEdit, onDelete }: CategoryTreeProps) {
    if (!categories || categories.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-8 py-12 text-center text-slate-500">
                <p className="text-sm font-medium">No categories yet</p>
                <p className="mt-2 text-xs text-slate-400">Create a root category to start organising the provider catalogue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {categories.map((category) => (
                <CategoryNode
                    key={category.id}
                    category={category}
                    depth={0}
                    expanded={expanded}
                    onToggle={onToggle}
                    onAddSubcategory={onAddSubcategory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

CategoryTree.displayName = 'CategoryTree';
