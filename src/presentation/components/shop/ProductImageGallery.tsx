
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
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
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Sort images by sequence
    const sortedImages = [...images].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const currentImage = sortedImages[selectedIndex];

    const nextImage = () => {
        setSelectedIndex((prev) => (prev + 1) % sortedImages.length);
    };

    const prevImage = () => {
        setSelectedIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
    };

    if (sortedImages.length === 0 && images360.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
                <p className="text-slate-500">No images available</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Main Image / 360 Viewer Toggle */}
            <div className="relative bg-white rounded-xl overflow-hidden border border-slate-200">
                {view360 && images360.length > 0 ? (
                    <Image360Viewer images={images360} autoPlay={false} autoPlaySpeed={80} />
                ) : currentImage ? (
                    <div className="relative group">
                        <img
                            src={currentImage.imageUrl}
                            alt={currentImage.altText || 'Product image'}
                            className="w-full h-auto cursor-zoom-in"
                            onClick={() => setLightboxOpen(true)}
                        />

                        {/* Navigation Arrows */}
                        {sortedImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Zoom Button */}
                        <button
                            onClick={() => setLightboxOpen(true)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View fullscreen"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                ) : null}

                {/* 360 Toggle Button */}
                {has360 && images360.length > 0 && (
                    <button
                        onClick={() => setView360(!view360)}
                        className="absolute top-4 left-4 px-4 py-2 bg-black/70 hover:bg-black/90 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
                    >
                        {view360 ? (
                            <>📷 Photos</>
                        ) : (
                            <>🔄 360° View</>
                        )}
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            {!view360 && sortedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {sortedImages.map((img, index) => (
                        <button
                            key={img.id}
                            onClick={() => setSelectedIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                index === selectedIndex
                                    ? 'border-blue-600 ring-2 ring-blue-200'
                                    : 'border-slate-200 hover:border-blue-400'
                            }`}
                        >
                            <img
                                src={img.imageUrl}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxOpen && currentImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <img
                        src={currentImage.imageUrl}
                        alt={currentImage.altText || 'Product image'}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {sortedImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevImage();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-medium">
                        {selectedIndex + 1} / {sortedImages.length}
                    </div>
                </div>
            )}
        </div>
    );
}
