
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, Maximize2, Minimize2, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductImage } from '../../../infrastructure/services/product-image.service';

interface Image360ViewerProps {
    images: ProductImage[];
    autoPlay?: boolean;
    autoPlaySpeed?: number;
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

    const sortedImages = [...images].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const totalFrames = sortedImages.length;

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Auto-play effect
    useEffect(() => {
        if (!isPlaying || totalFrames <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalFrames);
        }, autoPlaySpeed);

        return () => clearInterval(interval);
    }, [isPlaying, totalFrames, autoPlaySpeed]);

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setIsPlaying(false);
        startXRef.current = e.clientX;
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startXRef.current;
        const sensitivity = 5;
        const framesToMove = Math.floor(Math.abs(deltaX) / sensitivity);

        if (framesToMove > 0) {
            const direction = deltaX > 0 ? 1 : -1;
            const newIndex = (currentIndexRef.current + direction * framesToMove + totalFrames) % totalFrames;
            setCurrentIndex(newIndex);
            startXRef.current = e.clientX;
        }
    }, [isDragging, totalFrames]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove]);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setIsPlaying(false);
        startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        const deltaX = e.touches[0].clientX - startXRef.current;
        const sensitivity = 5;
        const framesToMove = Math.floor(Math.abs(deltaX) / sensitivity);

        if (framesToMove > 0) {
            const direction = deltaX > 0 ? 1 : -1;
            const newIndex = (currentIndexRef.current + direction * framesToMove + totalFrames) % totalFrames;
            setCurrentIndex(newIndex);
            startXRef.current = e.touches[0].clientX;
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const nextFrame = () => {
        setCurrentIndex((prev) => (prev + 1) % totalFrames);
    };

    const prevFrame = () => {
        setCurrentIndex((prev) => (prev - 1 + totalFrames) % totalFrames);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (totalFrames === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
                <p className="text-slate-500">No 360° images available</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}
        >
            {/* Main Image */}
            <div
                className="relative cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={sortedImages[currentIndex].imageUrl}
                    alt={`360° view frame ${currentIndex + 1}`}
                    className="w-full h-auto"
                    draggable={false}
                />

                {/* Drag Hint */}
                {!isDragging && currentIndex === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <RotateCw className="w-5 h-5" />
                            <span>Drag to rotate</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
                <button
                    onClick={prevFrame}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Previous frame"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                    ) : (
                        <Play className="w-5 h-5 text-white" />
                    )}
                </button>

                <button
                    onClick={nextFrame}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Next frame"
                >
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>

                <div className="w-px h-6 bg-white/20 mx-1" />

                <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? (
                        <Minimize2 className="w-5 h-5 text-white" />
                    ) : (
                        <Maximize2 className="w-5 h-5 text-white" />
                    )}
                </button>
            </div>

            {/* Frame Counter */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentIndex + 1} / {totalFrames}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                    className="h-full bg-blue-500 transition-all duration-100"
                    style={{ width: `${((currentIndex + 1) / totalFrames) * 100}%` }}
                />
            </div>
        </div>
    );
}