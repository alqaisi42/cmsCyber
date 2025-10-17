// src/infrastructure/services/product-image.service.ts
// Enhanced product image service with upload helpers

// =============================================================================
// IMPORTS
// =============================================================================

import { CreateImageRequest } from '../../core/entities/ecommerce';
import { ApiResponse } from '../../core/interfaces/repositories';

// =============================================================================
// PRODUCT IMAGE TYPES
// =============================================================================

export interface ProductImage {
    id: string;
    productId: string;
    imageUrl: string;
    imageType: 'regular' | 'rotation360' | '360' | 'thumbnail';
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor: string | null;
    variantId: string | null;
    altText: string | null;
    dimensions: string | null;
    fileSize: number | null;
    createdAt: string | null;
    rotationFrameNumber?: number | null;
}

export interface GroupedImages {
    primary: ProductImage | null;
    byVariant: Record<string, ProductImage[]>;
    byColor: Record<string, ProductImage[]>;
    all360: ProductImage[];
    allRegular: ProductImage[];
}

export interface UploadImageMetadata {
    filename: string;
    imageType: 'regular' | 'rotation360' | '360' | 'thumbnail';
    sequenceOrder?: number;
    isPrimary?: boolean;
    associatedColor?: string;
    variantId?: string;
    rotationFrameNumber?: number;
}

export interface UploadImagesResponse {
    uploadedImages: Array<{
        id: string;
        filename: string;
        imageUrl: string;
        imageType: 'regular' | 'rotation360' | '360' | 'thumbnail';
        fileSize: number;
        isPrimary: boolean;
    }>;
    failedUploads: Array<{
        filename: string;
        reason?: string;
    }>;
    totalUploaded: number;
    totalFailed: number;
}

// =============================================================================
// PRODUCT IMAGE SERVICE
// =============================================================================

class ProductImageService {
    private readonly baseUrl = '/api/v1';

    /**
     * Get all images for a product
     */
    async getProductImages(productId: string): Promise<ApiResponse<ProductImage[]>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images`);
        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Create a single product image record
     */
    async createProductImage(
        productId: string,
        payload: CreateImageRequest
    ): Promise<ApiResponse<ProductImage>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Group images by type for easier rendering
     */
    groupImages(images: ProductImage[]): GroupedImages {
        const grouped: GroupedImages = {
            primary: null,
            byVariant: {},
            byColor: {},
            all360: [],
            allRegular: [],
        };

        // Sort by sequence order first
        const sorted = [...images].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

        sorted.forEach(img => {
            // Find primary image
            if (img.isPrimary && !grouped.primary) {
                grouped.primary = img;
            }

            // Group by variant
            if (img.variantId) {
                if (!grouped.byVariant[img.variantId]) {
                    grouped.byVariant[img.variantId] = [];
                }
                grouped.byVariant[img.variantId].push(img);
            }

            // Group by color
            if (img.associatedColor) {
                if (!grouped.byColor[img.associatedColor]) {
                    grouped.byColor[img.associatedColor] = [];
                }
                grouped.byColor[img.associatedColor].push(img);
            }

            // Separate 360 and regular images
            if (img.imageType === '360' || img.imageType === 'rotation360') {
                grouped.all360.push(img);
            } else if (img.imageType === 'regular') {
                grouped.allRegular.push(img);
            }
        });

        return grouped;
    }

    /**
     * Get images for a specific variant
     */
    getVariantImages(images: ProductImage[], variantId: string): ProductImage[] {
        return images
            .filter(img => img.variantId === variantId)
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }

    /**
     * Get 360 images for rotation view
     */
    get360Images(images: ProductImage[], variantId?: string, color?: string): ProductImage[] {
        let filtered = images.filter(img => img.imageType === '360' || img.imageType === 'rotation360');

        if (variantId) {
            filtered = filtered.filter(img => img.variantId === variantId);
        }

        if (color) {
            filtered = filtered.filter(img => img.associatedColor === color);
        }

        return filtered.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }

    /**
     * Upload a list of product images with metadata
     */
    async uploadProductImages(
        productId: string,
        files: File[],
        metadata: UploadImageMetadata[] = []
    ): Promise<ApiResponse<UploadImagesResponse>> {
        if (!files.length) {
            throw new Error('At least one file is required to upload images');
        }

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        if (metadata.length) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await fetch(`${this.baseUrl}/products/images/upload/${productId}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

export const productImageService = new ProductImageService();
