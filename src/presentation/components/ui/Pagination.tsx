// Pagination Component
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export function Pagination({
                               currentPage,
                               totalPages,
                               onPageChange,
                               totalItems,
                               itemsPerPage,
                           }: PaginationProps) {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            {/* Info */}
            <div className="text-sm text-gray-600">
                {totalItems && itemsPerPage && (
                    <span>
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
                        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                    </span>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={cn(
                        'p-2 rounded-lg border transition-colors',
                        currentPage === 1
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                1
                            </button>
                            {startPage > 2 && (
                                <span className="px-2 text-gray-500">...</span>
                            )}
                        </>
                    )}

                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                'px-3 py-2 text-sm rounded-lg border transition-colors',
                                page === currentPage
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            {page}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={cn(
                        'p-2 rounded-lg border transition-colors',
                        currentPage === totalPages
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}