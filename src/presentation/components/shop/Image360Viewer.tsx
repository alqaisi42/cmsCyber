// src/presentation/components/shop/Image360Viewer.tsx
// NEW - 360° Product Image Viewer

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { ProductImage } from '../../../infrastructure/services/product-image.service';

interface Image360ViewerProps {
    images: ProductImage[];
    autoPlay?: boolean;
    autoPlaySpeed?: number; // ms per frame
    className?: string;
}

export function Image360Viewer({
                                   images,
                                   autoPlay = false,
                                   autoPlaySpeed = 100,
                                   className = ''
                               }: Image360ViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const currentIndexRef = useRef(0);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // Sort images by sequence
    const sortedImages = [...images].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const totalFrames = sortedImages.length;

    // Update current index ref
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Auto-play functionality
    useEffect(() => {
        if (isPlaying && totalFrames > 1) {
            autoPlayRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % totalFrames);
            }, autoPlaySpeed);
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [isPlaying, totalFrames, autoPlaySpeed]);

    // Mouse drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setIsPlaying(false); // Stop auto-play when user interacts
        startXRef.current = e.clientX;
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || totalFrames <= 1) return;

        const delta = e.clientX - startXRef.current;
        const sensitivity = 5; // Pixels per frame
        const frameDelta = Math.floor(delta / sensitivity);

        if (Math.abs(frameDelta) > 0) {
            setCurrentIndex(prev => {
                const newIndex = (prev - frameDelta + totalFrames) % totalFrames;
                return newIndex;
            });
            startXRef.current = e.clientX;
        }
    }, [isDragging, totalFrames]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        setIsPlaying(false);
        startXRef.current = e.touches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || totalFrames <= 1) return;

        const delta = e.touches[0].clientX - startXRef.current;
        const sensitivity = 5;
        const frameDelta = Math.floor(delta / sensitivity);

        if (Math.abs(frameDelta) > 0) {
            setCurrentIndex(prev => {
                const newIndex = (prev - frameDelta + totalFrames) % totalFrames;
                return newIndex;
            });
            startXRef.current = e.touches[0].clientX;
        }
    }, [isDragging, totalFrames]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    }, [isFullscreen]);

    // Prevent empty state
    if (totalFrames === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
                <p className="text-slate-500">No 360° images available</p>
            </div>
        );
    }

    const currentImage = sortedImages[currentIndex];

    return (
        <div
            ref={containerRef}
            className={`relative bg-slate-50 rounded-lg overflow-hidden ${className} ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
        >
            {/* Main Image */}
            <div
                className={`relative select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={currentImage.imageUrl}
                    alt={currentImage.altText || `360 view frame ${currentIndex + 1}`}
                    className="w-full h-auto object-contain"
                    draggable={false}
                />

                {/* Drag hint */}
                {!isDragging && totalFrames > 1 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2">
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Drag to rotate</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
                {/* Play/Pause */}
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Frame indicator */}
                <span className="text-sm font-medium text-slate-700">
          {currentIndex + 1} / {totalFrames}
        </span>

                {/* Fullscreen toggle */}
                <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                <div
                    className="h-full bg-blue-600 transition-all duration-100"
                    style={{ width: `${((currentIndex + 1) / totalFrames) * 100}%` }}
                />
            </div>
        </div>
    );
}