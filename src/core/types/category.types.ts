// =============================================================================
// Category Request Types
// File: src/core/types/category.types.ts
// =============================================================================

export interface ProviderCategoryCreateRequest {
    name: string;
    code: string;
    description?: string;
    iconUrl?: string;
    parentId?: string | null;
    displayOrder?: number;
}

export interface ProviderCategoryUpdateRequest {
    name?: string;
    description?: string;
    iconUrl?: string;
    parentId?: string | null;
    displayOrder?: number;
    isActive?: boolean;
}
