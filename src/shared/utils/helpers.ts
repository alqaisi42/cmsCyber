// src/shared/utils/helpers.ts
// Utility functions for TPA Healthcare System


// ============================================================================
// DATE & TIME UTILITIES
// ============================================================================

import {Claim, ClaimStatus, Procedure} from "../../core/entities/healthcare";

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string, locale: string = 'en-US'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(locale);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(d);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}

// ============================================================================
// FINANCIAL CALCULATIONS
// ============================================================================

/**
 * Calculate claim totals
 */
export function calculateClaimTotals(procedures: Procedure[]): {
    totalClaimed: number;
    totalDiscount: number;
    totalNet: number;
    totalCoInsurance: number;
    totalRejected: number;
    totalApproved: number;
} {
    return procedures.reduce(
        (acc, proc) => ({
            totalClaimed: acc.totalClaimed + proc.claimedAmount,
            totalDiscount: acc.totalDiscount + proc.discount,
            totalNet: acc.totalNet + proc.netAmount,
            totalCoInsurance: acc.totalCoInsurance + proc.coInsurance,
            totalRejected: acc.totalRejected + proc.rejectedAmount,
            totalApproved: acc.totalApproved + proc.approvedAmount,
        }),
        {
            totalClaimed: 0,
            totalDiscount: 0,
            totalNet: 0,
            totalCoInsurance: 0,
            totalRejected: 0,
            totalApproved: 0,
        }
    );
}

/**
 * Calculate procedure net amount
 */
export function calculateProcedureNet(
    quantity: number,
    unitPrice: number,
    discount: number
): number {
    const grossAmount = quantity * unitPrice;
    return grossAmount - discount;
}

/**
 * Format currency
 */
export function formatCurrency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
    }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

// ============================================================================
// CLAIM UTILITIES
// ============================================================================

/**
 * Calculate claim completion percentage
 */
export function calculateClaimCompleteness(claim: Partial<Claim>): number {
    const requiredFields = [
        'patientId',
        'providerId',
        'doctorId',
        'claimType',
        'visitDate',
        'claimDate',
    ];

    const requiredArrays = [
        { field: 'diagnoses', minLength: 1 },
        { field: 'procedures', minLength: 1 },
    ];

    let completed = 0;
    let total = requiredFields.length + requiredArrays.length;

    // Check required fields
    requiredFields.forEach((field) => {
        if (claim[field as keyof Claim]) completed++;
    });

    // Check required arrays
    requiredArrays.forEach(({ field, minLength }) => {
        const arr = claim[field as keyof Claim] as any[];
        if (arr && arr.length >= minLength) completed++;
    });

    return Math.round((completed / total) * 100);
}

/**
 * Check if claim is ready for submission
 */
export function isClaimReadyForSubmission(claim: Partial<Claim>): {
    ready: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (!claim.patientId) missingFields.push('Patient');
    if (!claim.providerId) missingFields.push('Provider');
    if (!claim.doctorId) missingFields.push('Doctor');
    if (!claim.claimType) missingFields.push('Claim Type');
    if (!claim.visitDate) missingFields.push('Visit Date');
    if (!claim.diagnoses || claim.diagnoses.length === 0) {
        missingFields.push('At least one diagnosis');
    }
    if (!claim.procedures || claim.procedures.length === 0) {
        missingFields.push('At least one procedure');
    }

    return {
        ready: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Generate claim number
 */
export function generateClaimNumber(prefix: string = '0001'): string {
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
}

/**
 * Get claim status color
 */
export function getClaimStatusColor(status: ClaimStatus): {
    bg: string;
    text: string;
    border: string;
} {
    const colors = {
        [ClaimStatus.DRAFT]: {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            border: 'border-gray-200',
        },
        [ClaimStatus.INCOMPLETE]: {
            bg: 'bg-amber-100',
            text: 'text-amber-700',
            border: 'border-amber-200',
        },
        [ClaimStatus.READY]: {
            bg: 'bg-emerald-100',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
        },
        [ClaimStatus.SUBMITTED]: {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            border: 'border-blue-200',
        },
        [ClaimStatus.UNDER_REVIEW]: {
            bg: 'bg-indigo-100',
            text: 'text-indigo-700',
            border: 'border-indigo-200',
        },
        [ClaimStatus.APPROVED]: {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
        },
        [ClaimStatus.PARTIALLY_APPROVED]: {
            bg: 'bg-teal-100',
            text: 'text-teal-700',
            border: 'border-teal-200',
        },
        [ClaimStatus.REJECTED]: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
        },
        [ClaimStatus.PAID]: {
            bg: 'bg-purple-100',
            text: 'text-purple-700',
            border: 'border-purple-200',
        },
    };

    return colors[status] || colors[ClaimStatus.DRAFT];
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
    // Matches: +962-79-1234567, 0791234567, etc.
    const phoneRegex = /^(\+?962|0)?7[789]\d{7}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate national ID
 */
export function isValidNationalId(id: string): boolean {
    // Jordan national ID: 10 digits
    return /^\d{10}$/.test(id);
}

/**
 * Validate ICD-10 code format
 */
export function isValidICD10Format(code: string): boolean {
    // Basic ICD-10 format: Letter + 2 digits + optional dot + more digits/letters
    return /^[A-Z]\d{2}(\.\d{1,2})?$/i.test(code);
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    const maxSizeMB = 10;
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        errors.push('Only JPG, PNG, and PDF files are allowed');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format full name
 */
export function formatFullName(
    firstName: string,
    middleName?: string,
    lastName?: string
): string {
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
}

/**
 * Highlight search term in text
 */
export function highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
}

/**
 * Sort by multiple criteria
 */
export function multiSort<T>(
    array: T[],
    criteria: Array<{
        key: keyof T;
        order?: 'asc' | 'desc';
    }>
): T[] {
    return [...array].sort((a, b) => {
        for (const criterion of criteria) {
            const aVal = a[criterion.key];
            const bVal = b[criterion.key];
            const order = criterion.order === 'desc' ? -1 : 1;

            if (aVal < bVal) return -1 * order;
            if (aVal > bVal) return 1 * order;
        }
        return 0;
    });
}

/**
 * Remove duplicates
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter((item) => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// ============================================================================
// DOWNLOAD UTILITIES
// ============================================================================

/**
 * Download file
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Export to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string
): void {
    if (data.length === 0) return;

    // Get headers
    const headers = Object.keys(data[0]);

    // Build CSV string
    const csvContent = [
        headers.join(','),
        ...data.map((row) =>
            headers.map((header) => {
                const value = row[header];
                // Escape commas and quotes
                const stringValue = String(value || '');
                return stringValue.includes(',') || stringValue.includes('"')
                    ? `"${stringValue.replace(/"/g, '""')}"`
                    : stringValue;
            }).join(',')
        ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
}

/**
 * Print element
 */
export function printElement(elementId: string): void {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const windowPrint = window.open('', '', 'width=900,height=650');
    if (!windowPrint) return;

    windowPrint.document.write(`
    <html>
      <head>
        <title>Print</title>
        <link rel="stylesheet" href="/print.css">
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
    windowPrint.document.close();
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Safe localStorage get
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Safe localStorage set
 */
export function setLocalStorage<T>(key: string, value: T): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Remove from localStorage
 */
export function removeLocalStorage(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Show toast notification (integrate with your toast library)
 */
export function showNotification(
    message: string,
    type: NotificationType = 'info'
): void {
    // TODO: Integrate with react-hot-toast or similar
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ============================================================================
// MOCK DATA GENERATORS (for development)
// ============================================================================

/**
 * Generate random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Generate random date in range
 */
export function randomDate(start: Date, end: Date): Date {
    return new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random item from array
 */
export function randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}