// File: src/core/types/provider.types.ts
import { ProviderAddress } from '@/core/entities/ecommerce';
export interface ProviderFilters {
    search: string;
    status: 'all' | 'active' | 'inactive';
    sortBy: 'name' | 'rating' | 'products' | 'revenue';
    sortOrder: 'asc' | 'desc';
    minRating?: number;
    minProducts?: number;
    categories?: string[];
}

export interface ProviderMetrics {
    revenue30Days: number;
    revenueGrowth: number;
    orderCount30Days: number;
    avgFulfillmentTime: number;
    returnRate: number;
    customerSatisfaction: number;
}

export interface ProviderSearchRequest {
    query?: string;
    isActive?: boolean;
    minRating?: number;
    maxCommission?: number;
    hasProducts?: boolean;
    sortBy?: 'NAME' | 'RATING' | 'COMMISSION' | 'PRODUCTS';
    sortDirection?: 'ASC' | 'DESC';
    page?: number;
    size?: number;
}

export interface ProviderSearchResult {
    id: string;
    name: string;
    logoUrl: string | null;
    rating: number | null;
    isActive: boolean;
    productsCount: number;
    commissionPercentage: number;
}

export interface CreateProviderRequest {
    name: string;
    logoUrl?: string;
    contactEmail: string;
    contactPhone?: string;
    website?: string;
    description?: string;
    businessRegistrationNumber?: string;
    taxNumber?: string;
    address: ProviderAddress;
    commissionPercentage: number;
    isActive?: boolean;
}

export interface UpdateProviderRequest {
    name?: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    description?: string;
    businessRegistrationNumber?: string;
    taxNumber?: string;
    address?: ProviderAddress;
    commissionPercentage?: number;
    isActive?: boolean;
    rating?: number;
}
