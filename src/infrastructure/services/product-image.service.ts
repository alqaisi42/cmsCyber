// src/infrastructure/services/product-image.service.ts
// FIXED - Define ApiResponse here

// ============================================================================
// API RESPONSE TYPE
// ============================================================================

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors?: string[];
    timestamp: string;
}

// ============================================================================
// PRODUCT IMAGE TYPES
// ============================================================================

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

// ============================================================================
// PRODUCT IMAGE SERVICE
// ============================================================================

class ProductImageService {
    private readonly baseUrl = '/api/v1';

    /**
     * Get all images for a product
     */
    async getProductImages(productId: string): Promise<ApiResponse<ProductImage[]>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            allRegular: []
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
            if (img.imageType === '360') {
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
        let filtered = images.filter(img => img.imageType === '360');

        if (variantId) {
            filtered = filtered.filter(img => img.variantId === variantId);
        }

        if (color) {
            filtered = filtered.filter(img => img.associatedColor === color);
        }

        return filtered.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    }
}

export const productImageService = new ProductImageService();