'use client';

import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteCategoryDialogProps {
    open: boolean;
    categoryName: string;
    warning?: string;
    onConfirm: () => Promise<void> | void;
    onCancel: () => void;
    deleting?: boolean;
    error?: string | null;
}

export function DeleteCategoryDialog({
    open,
    categoryName,
    warning,
    onConfirm,
    onCancel,
    deleting,
    error,
}: DeleteCategoryDialogProps) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-200/60 bg-white shadow-2xl">
                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="space-y-6 px-8 pb-8 pt-10">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-2xl bg-red-50 p-3 text-red-500">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Delete category</p>
                            <h2 className="text-2xl font-bold text-slate-900">Remove “{categoryName}”?</h2>
                            <p className="text-sm text-slate-600">
                                This action cannot be undone. Make sure the category has no products or subcategories assigned before
                                deleting it.
                            </p>
                            {warning ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-600">{warning}</p> : null}
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                    ) : null}

                    <div className="flex flex-col gap-3 border-t border-red-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void onConfirm()}
                            disabled={deleting}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            <span>Delete category</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

DeleteCategoryDialog.displayName = 'DeleteCategoryDialog';
