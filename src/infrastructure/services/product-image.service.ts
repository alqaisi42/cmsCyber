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

export type ImageType =
    | "REGULAR"
    | "ROTATION360"
    | "THUMBNAIL";

export interface UploadImageMetadata {
    filename: string;
    imageType: ImageType;
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
        imageType: ImageType;
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
     * Upload a list of product images with metadata - SINGLE REQUEST
     */
    async uploadProductImages(
        productId: string,
        files: File[],
        metadata: UploadImageMetadata[] = []
    ): Promise<ApiResponse<UploadImagesResponse>> {

        if (!files.length) {
            throw new Error("At least one file is required");
        }

        // Ensure metadata array has an entry for each file
        const fullMetadata: UploadImageMetadata[] = files.map((file, index) => {
            if (metadata[index]) {
                // If this is a 360 rotation image, ensure frame number starts from 1
                if (metadata[index].imageType === "ROTATION360" &&
                    metadata[index].rotationFrameNumber !== undefined) {
                    return {
                        ...metadata[index],
                        rotationFrameNumber: metadata[index].rotationFrameNumber! > 0
                            ? metadata[index].rotationFrameNumber
                            : index + 1  // Ensure it starts from 1, not 0
                    };
                }
                return metadata[index];
            }

            // Create default metadata for files without metadata
            return {
                filename: file.name,
                imageType: "REGULAR" as ImageType,
                sequenceOrder: index + 1, // Start from 1, not 0
                isPrimary: index === 0,
            };
        });

        // Fix 360 rotation frame numbers to ensure they start from 1
        let rotation360Count = 0;
        fullMetadata.forEach((meta, index) => {
            if (meta.imageType === "ROTATION360") {
                rotation360Count++;
                // Ensure rotation frame numbers are sequential starting from 1
                if (!meta.rotationFrameNumber || meta.rotationFrameNumber < 1) {
                    meta.rotationFrameNumber = rotation360Count;
                }
            }
        });

        const formData = new FormData();

        // Add all files to formData
        files.forEach((file) => {
            formData.append("files", file);
        });

        // Add metadata as a single JSON array
        try {
            const metadataJson = JSON.stringify(fullMetadata);
            formData.append("metadata", metadataJson);

            console.log(`Uploading ${files.length} files with metadata:`, fullMetadata);
        } catch (jsonError) {
            throw new Error(`Failed to stringify metadata: ${jsonError}`);
        }

        let response;
        try {
            response = await fetch(
                `http://148.230.111.245:32080/api/v1/products/images/upload/${productId}`,
                {
                    method: "POST",
                    body: formData,
                    // You might need to add timeout for large uploads
                    signal: AbortSignal.timeout(300000), // 5 minutes timeout
                }
            );
        } catch (networkErr) {
            console.error("Network error during upload:", networkErr);
            return {
                success: false,
                message: `Upload failed: ${networkErr}`,
                data: {
                    uploadedImages: [],
                    failedUploads: [{
                        filename: "all",
                        reason: `Network error: ${networkErr}`,
                    }],
                    totalUploaded: 0,
                    totalFailed: files.length,
                },
                timestamp: new Date().toISOString(),
            };
        }

        const rawText = await response.text();

        if (!response.ok) {
            console.error(`Server error (${response.status}):`, rawText);

            // Try to parse error details
            let errorMessage = rawText;
            try {
                const errorJson = JSON.parse(rawText);
                errorMessage = errorJson.message || errorJson.error || rawText;
            } catch {
                // Keep rawText as error message
            }

            return {
                success: false,
                message: `Upload failed: ${errorMessage}`,
                data: {
                    uploadedImages: [],
                    failedUploads: files.map(f => ({
                        filename: f.name,
                        reason: errorMessage,
                    })),
                    totalUploaded: 0,
                    totalFailed: files.length,
                },
                timestamp: new Date().toISOString(),
            };
        }

        let json;
        try {
            json = JSON.parse(rawText);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return {
                success: false,
                message: "Invalid response from server",
                data: {
                    uploadedImages: [],
                    failedUploads: [{
                        filename: "all",
                        reason: "Invalid JSON response from server",
                    }],
                    totalUploaded: 0,
                    totalFailed: files.length,
                },
                timestamp: new Date().toISOString(),
            };
        }

        // Validate the response structure
        if (!json.data || !json.data.uploadedImages) {
            console.error("Invalid response structure:", json);
            return {
                success: false,
                message: "Invalid response structure from server",
                data: {
                    uploadedImages: [],
                    failedUploads: [{
                        filename: "all",
                        reason: "Invalid response structure",
                    }],
                    totalUploaded: 0,
                    totalFailed: files.length,
                },
                timestamp: new Date().toISOString(),
            };
        }

        const result = {
            success: json.data.totalFailed === 0,
            message: json.data.totalFailed === 0
                ? `All ${json.data.totalUploaded} images uploaded successfully`
                : `Partial success: ${json.data.totalUploaded} uploaded, ${json.data.totalFailed} failed`,
            data: {
                uploadedImages: json.data.uploadedImages || [],
                failedUploads: json.data.failedUploads || [],
                totalUploaded: json.data.totalUploaded || 0,
                totalFailed: json.data.totalFailed || 0,
            },
            timestamp: new Date().toISOString(),
        };

        console.log("Upload complete:", result.message);

        return result;
    }

    /**
     * Delete a product image
     */
    async deleteProductImage(productId: string, imageId: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images/${imageId}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return {
            success: true,
            message: 'Image deleted successfully',
            data: undefined,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Update image metadata (sequence, primary status, etc.)
     */
    async updateProductImage(
        productId: string,
        imageId: string,
        updates: Partial<ProductImage>
    ): Promise<ApiResponse<ProductImage>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images/${imageId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Reorder images by updating their sequence order
     */
    async reorderImages(
        productId: string,
        imageOrders: Array<{ imageId: string; sequenceOrder: number }>
    ): Promise<ApiResponse<ProductImage[]>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ imageOrders }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Set primary image for a product
     */
    async setPrimaryImage(productId: string, imageId: string): Promise<ApiResponse<ProductImage>> {
        const response = await fetch(`${this.baseUrl}/products/${productId}/images/${imageId}/primary`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Helper to prepare 360 rotation metadata
     */
    prepare360Metadata(files: File[], startingSequence: number = 1): UploadImageMetadata[] {
        return files.map((file, index) => ({
            filename: file.name,
            imageType: "ROTATION360" as ImageType,
            sequenceOrder: startingSequence + index,
            rotationFrameNumber: index + 1, // Always starts from 1
            isPrimary: false,
        }));
    }

    /**
     * Helper to prepare regular image metadata
     */
    prepareRegularMetadata(
        files: File[],
        options?: {
            startingSequence?: number;
            variantId?: string;
            associatedColor?: string;
        }
    ): UploadImageMetadata[] {
        const startSeq = options?.startingSequence || 1;

        return files.map((file, index) => ({
            filename: file.name,
            imageType: "REGULAR" as ImageType,
            sequenceOrder: startSeq + index,
            isPrimary: index === 0 && startSeq === 1,
            variantId: options?.variantId,
            associatedColor: options?.associatedColor,
        }));
    }
}

export const productImageService = new ProductImageService();