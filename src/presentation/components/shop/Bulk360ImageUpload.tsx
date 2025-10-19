// src/presentation/components/shop/Bulk360ImageUpload.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Upload,
    X,
    RotateCw,
    Image as ImageIcon,
    GripVertical,
    AlertCircle,
    Check,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Download,
    Trash2,
} from 'lucide-react';

// Types
interface Image360Data {
    id: string;
    file?: File;
    url: string;
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor?: string;
    variantId?: string;
}

interface Bulk360ImageUploadProps {
    onImagesChange: (images: Image360Data[]) => void;
    initialImages?: Image360Data[];
    maxFiles?: number;
    acceptedFormats?: string[];
    maxFileSize?: number; // in MB
    associatedColor?: string;
    variantId?: string;
}

// Sortable Image Item Component
const SortableImageItem: React.FC<{
    image: Image360Data;
    index: number;
    onRemove: (id: string) => void;
    onSetPrimary: (id: string) => void;
    isDragging?: boolean;
}> = ({ image, index, onRemove, onSetPrimary, isDragging }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group bg-white rounded-lg border-2 ${
                image.isPrimary ? 'border-blue-500' : 'border-slate-200'
            } shadow-sm hover:shadow-md transition-all`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1 bg-white/90 rounded cursor-move z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-4 h-4 text-slate-600" />
            </div>

            {/* Frame Number Badge */}
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                Frame {index + 1}
            </div>

            {/* Image */}
            <div className="aspect-square overflow-hidden rounded-t-lg bg-slate-100">
                <img
                    src={image.url}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Actions */}
            <div className="p-2 flex items-center justify-between">
                <button
                    onClick={() => onSetPrimary(image.id)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                        image.isPrimary
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    {image.isPrimary ? (
                        <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Primary
                        </span>
                    ) : (
                        'Set Primary'
                    )}
                </button>
                <button
                    onClick={() => onRemove(image.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Main Component
export const Bulk360ImageUpload: React.FC<Bulk360ImageUploadProps> = ({
    onImagesChange,
    initialImages = [],
    maxFiles = 50,
    acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize = 5, // MB
    associatedColor,
    variantId,
}) => {
    const [images, setImages] = useState<Image360Data[]>(initialImages);
    const [dragActive, setDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Update parent when images change
    useEffect(() => {
        const formattedImages = images.map((img, index) => ({
            ...img,
            sequenceOrder: index,
            associatedColor,
            variantId,
        }));
        onImagesChange(formattedImages);
    }, [images, onImagesChange, associatedColor, variantId]);

    // Handle file validation
    const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
        const valid: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach((file) => {
            // Check file type
            if (!acceptedFormats.includes(file.type)) {
                errors.push(`${file.name}: Invalid format. Accepted: ${acceptedFormats.join(', ')}`);
                return;
            }

            // Check file size
            if (file.size > maxFileSize * 1024 * 1024) {
                errors.push(`${file.name}: File too large. Max size: ${maxFileSize}MB`);
                return;
            }

            valid.push(file);
        });

        // Check total count
        if (images.length + valid.length > maxFiles) {
            errors.push(`Maximum ${maxFiles} images allowed. You have ${images.length} and trying to add ${valid.length}.`);
            return { valid: [], errors };
        }

        return { valid, errors };
    };

    // Process uploaded files
    const processFiles = async (files: File[]) => {
        const newImages: Image360Data[] = [];

        for (const file of files) {
            const url = URL.createObjectURL(file);
            const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

            newImages.push({
                id,
                file,
                url,
                sequenceOrder: images.length + newImages.length,
                isPrimary: images.length === 0 && newImages.length === 0,
                associatedColor,
                variantId,
            });
        }

        setImages((prev) => [...prev, ...newImages]);
        setErrors([]);
    };

    // Handle drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const { valid, errors } = validateFiles(e.dataTransfer.files);
            if (errors.length > 0) {
                setErrors(errors);
            }
            if (valid.length > 0) {
                processFiles(valid);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const { valid, errors } = validateFiles(e.target.files);
            if (errors.length > 0) {
                setErrors(errors);
            }
            if (valid.length > 0) {
                processFiles(valid);
            }
        }
    };

    // Handle drag sorting
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    // Handle actions
    const removeImage = (id: string) => {
        setImages((prev) => {
            const filtered = prev.filter((img) => img.id !== id);
            // If removed was primary, set first as primary
            if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
                filtered[0].isPrimary = true;
            }
            return filtered;
        });
    };

    const setPrimaryImage = (id: string) => {
        setImages((prev) =>
            prev.map((img) => ({
                ...img,
                isPrimary: img.id === id,
            }))
        );
    };

    const clearAll = () => {
        setImages([]);
        setErrors([]);
    };

    // Preview mode navigation
    const nextPreview = () => {
        setCurrentPreviewIndex((prev) => (prev + 1) % images.length);
    };

    const prevPreview = () => {
        setCurrentPreviewIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <RotateCw className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">360° Images</h3>
                    <span className="text-sm text-slate-500">
                        ({images.length}/{maxFiles})
                    </span>
                </div>
                {images.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPreviewMode(true)}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                            <Maximize2 className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            onClick={clearAll}
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                    dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedFormats.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-700 mb-2">
                        Drag & drop your 360° images here, or{' '}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            browse
                        </button>
                    </p>
                    <p className="text-xs text-slate-500">
                        Support for {acceptedFormats.join(', ')} • Max {maxFileSize}MB per file • Up to {maxFiles} images
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        💡 Tip: Select all 360° images at once for faster upload
                    </p>
                </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="space-y-1">
                            {errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-700">
                                    {error}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Grid with Sorting */}
            {images.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {images.map((image, index) => (
                                <SortableImageItem
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    onRemove={removeImage}
                                    onSetPrimary={setPrimaryImage}
                                    isDragging={activeId === image.id}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-50">
                                <ImageIcon className="w-20 h-20" />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Preview Modal */}
            {previewMode && images.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                    <div className="relative max-w-4xl max-h-screen p-4">
                        <button
                            onClick={() => setPreviewMode(false)}
                            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="relative">
                            <img
                                src={images[currentPreviewIndex].url}
                                alt={`Preview frame ${currentPreviewIndex + 1}`}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
                                Frame {currentPreviewIndex + 1} of {images.length}
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <button
                                onClick={prevPreview}
                                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextPreview}
                                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};