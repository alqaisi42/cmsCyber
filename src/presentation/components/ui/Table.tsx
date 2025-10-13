// Reusable Table Component
'use client';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../../shared/utils/cn';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => ReactNode;
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    loading?: boolean;
    emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
                                                         data,
                                                         columns,
                                                         sortBy,
                                                         sortOrder,
                                                         onSort,
                                                         loading = false,
                                                         emptyMessage = 'No data available',
                                                     }: TableProps<T>) {
    const renderSortIcon = (columnKey: string) => {
        if (sortBy !== columnKey) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
        }
        return sortOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
        ) : (
            <ChevronDown className="w-4 h-4 text-blue-600" />
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <p className="text-lg font-medium">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={cn(
                                    'px-6 py-4 text-left text-sm font-semibold text-gray-700',
                                    column.sortable && 'cursor-pointer hover:bg-gray-100 select-none'
                                )}
                                onClick={() => column.sortable && onSort?.(column.key)}
                            >
                                <div className="flex items-center gap-2">
                                    {column.label}
                                    {column.sortable && renderSortIcon(column.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <tr
                            key={item.id || index}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            {columns.map((column) => (
                                <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                                    {column.render ? column.render(item) : item[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}