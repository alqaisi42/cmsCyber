// src/presentation/components/shop/ProductImageGallery.tsx
// NEW - Product Image Gallery with 360° View Support

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { ProductImage } from '../../../infrastructure/services/product-image.service';
import { Image360Viewer } from './Image360Viewer';

interface ProductImageGalleryProps {
    images: ProductImage[];
    images360?: ProductImage[];
    has360?: boolean;
    className?: string;
}

export function ProductImageGallery({
                                        images,
                                        images360 = [],
                                        has360 = false,
                                        className = ''
                                    }: ProductImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [view360, setView360] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Filter regular images and sort by sequence
    const regularImages = images
        .filter(img => img.imageType === 'regular' || img.imageType === 'thumbnail')
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    const has360Images = has360 && images360.length > 0;
    const currentImage = regularImages[selectedIndex];

    const handlePrevious = () => {
        setSelectedIndex(prev => (prev - 1 + regularImages.length) % regularImages.length);
    };

    const handleNext = () => {
        setSelectedIndex(prev => (prev + 1) % regularImages.length);
    };

    if (regularImages.length === 0 && !has360Images) {
        return (
            <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
                <p className="text-slate-500">No images available</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Main Display Area */}
            <div className="relative bg-white rounded-lg overflow-hidden border border-slate-200">
                {view360 && has360Images ? (
                    <Image360Viewer
                        images={images360}
                        autoPlay={false}
                        className="h-96"
                    />
                ) : (
                    <>
                        {/* Main Image */}
                        <div className="relative h-96 flex items-center justify-center bg-slate-50">
                            <img
                                src={currentImage?.imageUrl}
                                alt={currentImage?.altText || 'Product image'}
                                className="max-h-full max-w-full object-contain"
                            />

                            {/* Navigation Arrows */}
                            {regularImages.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevious}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-slate-900" />
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                                    >
                                        <ChevronRight className="w-6 h-6 text-slate-900" />
                                    </button>
                                </>
                            )}

                            {/* Fullscreen Button */}
                            <button
                                onClick={() => setIsLightboxOpen(true)}
                                className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                            >
                                <Maximize2 className="w-5 h-5 text-slate-900" />
                            </button>
                        </div>

                        {/* Image Counter */}
                        {regularImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                {selectedIndex + 1} / {regularImages.length}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Thumbnail Grid & Controls */}
            <div className="mt-4 space-y-4">
                {/* View Toggle */}
                {has360Images && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView360(false)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                !view360
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Gallery View
                        </button>
                        <button
                            onClick={() => setView360(true)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                view360
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            360° View ({images360.length} frames)
                        </button>
                    </div>
                )}

                {/* Thumbnail Grid */}
                {!view360 && regularImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                        {regularImages.map((img, index) => (
                            <button
                                key={img.id}
                                onClick={() => setSelectedIndex(index)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                    index === selectedIndex
                                        ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                                        : 'border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                <img
                                    src={img.imageUrl}
                                    alt={img.altText || `Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && currentImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 text-white hover:text-slate-300 text-4xl font-light"
                    >
                        ×
                    </button>
                    <img
                        src={currentImage.imageUrl}
                        alt={currentImage.altText || 'Product image'}
                        className="max-h-full max-w-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}