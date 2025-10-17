// =============================================================================
// Number Utility Functions
// File: src/shared/utils/number.utils.ts
// =============================================================================

/**
 * Safely format a number to a fixed decimal places
 * Returns '0.0' if value is null/undefined
 */
export function safeToFixed(
    value: number | null | undefined,
    decimals: number = 2
): string {
    if (value === null || value === undefined || isNaN(value)) {
        return '0'.padEnd(decimals > 0 ? decimals + 2 : 1, '.0');
    }
    return value.toFixed(decimals);
}

/**
 * Format number as currency
 */
export function formatCurrency(
    value: number | null | undefined,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    const safeValue = value ?? 0;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(safeValue);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(
    value: number | null | undefined
): string {
    const safeValue = value ?? 0;

    if (safeValue >= 1_000_000_000) {
        return `${(safeValue / 1_000_000_000).toFixed(1)}B`;
    }
    if (safeValue >= 1_000_000) {
        return `${(safeValue / 1_000_000).toFixed(1)}M`;
    }
    if (safeValue >= 1_000) {
        return `${(safeValue / 1_000).toFixed(1)}K`;
    }

    return safeValue.toString();
}

/**
 * Format percentage
 */
export function formatPercentage(
    value: number | null | undefined,
    decimals: number = 1
): string {
    const safeValue = value ?? 0;
    return `${safeValue.toFixed(decimals)}%`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(
    value: number,
    min: number,
    max: number
): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Check if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Safe division (returns 0 if divider is 0)
 */
export function safeDivide(
    numerator: number,
    denominator: number,
    fallback: number = 0
): number {
    if (denominator === 0) return fallback;
    return numerator / denominator;
}

/**
 * Calculate average safely
 */
export function safeAverage(
    values: (number | null | undefined)[],
    decimals: number = 2
): number {
    const validValues = values.filter(isValidNumber);

    if (validValues.length === 0) return 0;

    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const average = sum / validValues.length;

    return Number(average.toFixed(decimals));
}