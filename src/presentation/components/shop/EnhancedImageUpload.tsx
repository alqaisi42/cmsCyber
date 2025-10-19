// src/presentation/components/shop/EnhancedImageUpload.tsx
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
    UniqueIdentifier,
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
    Edit2,
    Eye,
    Link,
} from 'lucide-react';

// Types
export interface ImageData {
    id: string;
    file?: File;
    url: string;
    imageType: 'regular' | 'rotation360' | '360' | 'thumbnail';
    sequenceOrder: number;
    isPrimary: boolean;
    associatedColor?: string;
    variantId?: string;
    rotationFrameNumber?: number;
    caption?: string;
}

export interface EnhancedImageUploadProps {
    onImagesChange: (images: ImageData[]) => void;
    initialImages?: ImageData[];
    maxFiles?: number;
    acceptedFormats?: string[];
    maxFileSize?: number; // in MB
    imageType?: 'regular' | 'rotation360';
    associatedColor?: string;
    variantId?: string;
    allowUrlInput?: boolean;
    allowCaptions?: boolean;
}

// Sortable Image Item Component
const SortableImageItem: React.FC<{
    image: ImageData;
    index: number;
    onRemove: (id: string) => void;
    onSetPrimary: (id: string) => void;
    onUpdateCaption?: (id: string, caption: string) => void;
    isDragging?: boolean;
    allowCaptions?: boolean;
}> = ({ image, index, onRemove, onSetPrimary, onUpdateCaption, isDragging, allowCaptions }) => {
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [caption, setCaption] = useState(image.caption || '');

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

    const handleCaptionSave = () => {
        onUpdateCaption?.(image.id, caption);
        setIsEditingCaption(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group bg-white rounded-lg border-2 ${
                image.isPrimary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
            } shadow-sm hover:shadow-lg transition-all duration-200`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1.5 bg-white/90 rounded cursor-move z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-4 h-4 text-slate-600" />
            </div>

            {/* Sequence Number Badge */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/75 text-white text-xs font-semibold rounded-full z-10">
                {index + 1}
            </div>

            {/* Image */}
            <div className="aspect-square relative overflow-hidden rounded-t-lg bg-slate-100">
                <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {image.isPrimary && (
                    <div className="absolute top-2 left-12 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Primary
                    </div>
                )}
            </div>

            {/* Caption */}
            {allowCaptions && (
                <div className="p-2 border-t border-slate-100">
                    {isEditingCaption ? (
                        <div className="flex gap-1">
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCaptionSave()}
                                className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="Add caption..."
                                autoFocus
                            />
                            <button
                                onClick={handleCaptionSave}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsEditingCaption(true)}
                            className="text-xs text-slate-600 cursor-text hover:bg-slate-50 rounded px-2 py-1"
                        >
                            {caption || 'Click to add caption...'}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!image.isPrimary && (
                    <button
                        onClick={() => onSetPrimary(image.id)}
                        className="p-1.5 bg-white/90 rounded hover:bg-blue-50 transition-colors"
                        title="Set as primary"
                    >
                        <Check className="w-4 h-4 text-slate-600" />
                    </button>
                )}
                <button
                    onClick={() => onRemove(image.id)}
                    className="p-1.5 bg-white/90 rounded hover:bg-red-50 transition-colors"
                    title="Remove image"
                >
                    <X className="w-4 h-4 text-red-600" />
                </button>
            </div>
        </div>
    );
};

// Image Preview Modal
const ImagePreviewModal: React.FC<{
    images: ImageData[];
    isOpen: boolean;
    onClose: () => void;
}> = ({ images, isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRotating, setIsRotating] = useState(false);

    useEffect(() => {
        if (isOpen && images.some(img => img.imageType === 'rotation360' || img.imageType === '360')) {
            setIsRotating(true);
        }
    }, [isOpen, images]);

    useEffect(() => {
        if (!isRotating) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 100); // Adjust speed as needed

        return () => clearInterval(interval);
    }, [isRotating, images.length]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative max-w-4xl w-full mx-4">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                    <div className="aspect-square bg-slate-100 relative">
                        <img
                            src={currentImage.url}
                            alt={`Preview ${currentIndex + 1}`}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-medium">
                                    {currentIndex + 1} / {images.length}
                                </span>
                                <button
                                    onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {(images[0]?.imageType === 'rotation360' || images[0]?.imageType === '360') && (
                                <button
                                    onClick={() => setIsRotating(!isRotating)}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                        isRotating
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
                                    {isRotating ? 'Pause' : 'Rotate'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// URL Input Modal
const URLInputModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!url) {
            setError('Please enter a URL');
            return;
        }

        try {
            new URL(url);
            onSubmit(url);
            setUrl('');
            setError('');
            onClose();
        } catch {
            setError('Please enter a valid URL');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Image from URL</h3>

                <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                />

                {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add Image
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
export const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
                                                                            onImagesChange,
                                                                            initialImages = [],
                                                                            maxFiles = 50,
                                                                            acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
                                                                            maxFileSize = 5, // MB
                                                                            imageType = 'regular',
                                                                            associatedColor,
                                                                            variantId,
                                                                            allowUrlInput = true,
                                                                            allowCaptions = false,
                                                                        }) => {
    const [images, setImages] = useState<ImageData[]>(initialImages);
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [urlModalOpen, setUrlModalOpen] = useState(false);
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
            rotationFrameNumber: imageType === 'rotation360' ? index : undefined,
        }));
        onImagesChange(formattedImages);
    }, [images, onImagesChange, imageType]);

    // Handle file validation
    const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
        const valid: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach((file) => {
            // Check file type
            if (!acceptedFormats.some(format => file.type === format.replace('image/', 'image/'))) {
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
        const newImages: ImageData[] = [];

        for (const file of files) {
            const url = URL.createObjectURL(file);
            const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

            newImages.push({
                id,
                file,
                url,
                imageType,
                sequenceOrder: images.length + newImages.length,
                isPrimary: images.length === 0 && newImages.length === 0,
                associatedColor,
                variantId,
                rotationFrameNumber: imageType === 'rotation360' ? images.length + newImages.length : undefined,
            });
        }

        setImages((prev) => [...prev, ...newImages]);
        setErrors([]);
    };

    // Handle URL input
    const handleUrlSubmit = (url: string) => {
        const id = `url-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const newImage: ImageData = {
            id,
            url,
            imageType,
            sequenceOrder: images.length,
            isPrimary: images.length === 0,
            associatedColor,
            variantId,
            rotationFrameNumber: imageType === 'rotation360' ? images.length : undefined,
        };

        setImages((prev) => [...prev, newImage]);
    };

    // Handle drag events for file upload
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            const rect = e.currentTarget.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX >= rect.right ||
                e.clientY < rect.top ||
                e.clientY >= rect.bottom
            ) {
                setDragActive(false);
            }
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
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
    }, [images.length, maxFiles, acceptedFormats, maxFileSize]);

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

    // Handle sortable drag
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
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

    const updateImageCaption = (id: string, caption: string) => {
        setImages((prev) =>
            prev.map((img) =>
                img.id === id ? { ...img, caption } : img
            )
        );
    };

    const clearAll = () => {
        setImages([]);
        setErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {imageType === 'rotation360' ? (
                        <RotateCw className="w-5 h-5 text-blue-600" />
                    ) : (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                    )}
                    <h3 className="text-lg font-semibold text-slate-900">
                        {imageType === 'rotation360' ? '360° Images' : 'Product Images'}
                    </h3>
                    <span className="text-sm text-slate-500">
                        ({images.length}/{maxFiles})
                    </span>
                </div>
                {images.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            type="button"
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
                        Drag & drop your images here, or{' '}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            browse
                        </button>
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                        Supported formats: JPEG, PNG, WebP • Max size: {maxFileSize}MB
                    </p>
                    {allowUrlInput && (
                        <button
                            type="button"
                            onClick={() => setUrlModalOpen(true)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
                        >
                            <Link className="w-4 h-4" />
                            Add from URL
                        </button>
                    )}
                </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

            {/* Images Grid with Drag & Drop Sorting */}
            {images.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images.map(img => img.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {images.map((image, index) => (
                                <SortableImageItem
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    onRemove={removeImage}
                                    onSetPrimary={setPrimaryImage}
                                    onUpdateCaption={allowCaptions ? updateImageCaption : undefined}
                                    isDragging={activeId === image.id}
                                    allowCaptions={allowCaptions}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-50">
                                <img
                                    src={images.find(img => img.id === activeId)?.url}
                                    alt="Dragging"
                                    className="w-32 h-32 object-cover rounded-lg shadow-2xl"
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Preview Modal */}
            <ImagePreviewModal
                images={images}
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
            />

            {/* URL Input Modal */}
            <URLInputModal
                isOpen={urlModalOpen}
                onClose={() => setUrlModalOpen(false)}
                onSubmit={handleUrlSubmit}
            />
        </div>
    );
};