import { ProductVariant, VariantImage, VariantImageGroup } from '../../core/entities/ecommerce';
import { ProductImage } from '../../infrastructure/services/product-image.service';

export interface VariantMediaSummary {
    allImages: ProductImage[];
    rotationImages: ProductImage[];
    total: number;
    has360: boolean;
}

function normalizeVariantImage(
    variant: ProductVariant,
    image: VariantImage,
    fallbackIndex: number
): ProductImage {
    const rotationFrameNumber =
        typeof image.rotationFrameNumber === 'number' ? image.rotationFrameNumber : null;

    const sequenceOrderCandidate =
        typeof rotationFrameNumber === 'number'
            ? rotationFrameNumber
            : typeof image.sequenceOrder === 'number'
            ? image.sequenceOrder
            : fallbackIndex;

    const sequenceOrder = Number.isFinite(sequenceOrderCandidate)
        ? (sequenceOrderCandidate as number)
        : fallbackIndex;

    const normalizedType = image.imageType === 'rotation360' ? '360' : image.imageType ?? 'regular';

    return {
        id: image.id ?? `${variant.id}-${fallbackIndex}`,
        productId: image.productId ?? variant.productId,
        imageUrl: image.imageUrl,
        imageType: normalizedType,
        sequenceOrder,
        isPrimary: Boolean(image.isPrimary),
        associatedColor:
            image.associatedColor !== undefined && image.associatedColor !== null
                ? image.associatedColor
                : null,
        variantId: image.variantId ?? variant.id,
        altText: null,
        dimensions: null,
        fileSize: null,
        createdAt: image.createdAt ?? null,
        rotationFrameNumber,
    };
}

export function collectVariantMedia(variant: ProductVariant): VariantMediaSummary {
    const rawImages = variant.images;

    if (!rawImages) {
        return { allImages: [], rotationImages: [], total: 0, has360: false };
    }

    const collected: Array<{ image: ProductImage; index: number }> = [];

    const pushImage = (image: VariantImage | null | undefined, index: number) => {
        if (!image || !image.imageUrl) {
            return;
        }

        collected.push({
            image: normalizeVariantImage(variant, image, index),
            index,
        });
    };

    if (Array.isArray(rawImages)) {
        rawImages.forEach((image, index) => pushImage(image, index));
    } else {
        const grouped = rawImages as VariantImageGroup;
        let nextIndex = collected.length;

        if (grouped.primaryImage) {
            pushImage(grouped.primaryImage, nextIndex++);
        }

        grouped.galleryImages?.forEach((image) => pushImage(image, nextIndex++));
        grouped.rotation360Images?.forEach((image) => pushImage(image, nextIndex++));
    }

    const allImages = collected
        .sort((a, b) => {
            if (a.image.sequenceOrder === b.image.sequenceOrder) {
                return a.index - b.index;
            }
            return a.image.sequenceOrder - b.image.sequenceOrder;
        })
        .map(({ image }) => image);

    const rotationImages = allImages.filter(
        (image) => image.imageType === '360' || image.imageType === 'rotation360'
    );

    const total = Array.isArray(rawImages)
        ? allImages.length
        : typeof (rawImages as VariantImageGroup).totalImages === 'number'
        ? (rawImages as VariantImageGroup).totalImages
        : allImages.length;

    const has360 =
        rotationImages.length > 0 ||
        (!Array.isArray(rawImages) && Boolean((rawImages as VariantImageGroup).has360View));

    return { allImages, rotationImages, total, has360 };
}
