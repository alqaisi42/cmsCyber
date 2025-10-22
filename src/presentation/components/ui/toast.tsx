'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}

interface ToastInstance extends ToastOptions {
    id: string;
}

interface ToastContextValue {
    pushToast: (options: ToastOptions) => string;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 5000;

function createToastId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 10);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastInstance[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback(
        ({ type = 'info', duration = DEFAULT_DURATION, ...options }: ToastOptions) => {
            const id = createToastId();
            const toast: ToastInstance = { id, type, duration, ...options };

            setToasts((prev) => [...prev, toast]);

            if (duration !== 0) {
                window.setTimeout(() => {
                    dismissToast(id);
                }, duration);
            }

            return id;
        },
        [dismissToast]
    );

    const value = useMemo<ToastContextValue>(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

    const renderIcon = (type: ToastType) => {
        const iconClasses = 'w-5 h-5 flex-shrink-0';
        switch (type) {
            case 'success':
                return <CheckCircle2 className={`${iconClasses} text-emerald-500`} />;
            case 'error':
                return <AlertTriangle className={`${iconClasses} text-rose-500`} />;
            case 'warning':
                return <AlertTriangle className={`${iconClasses} text-amber-500`} />;
            default:
                return <Info className={`${iconClasses} text-blue-500`} />;
        }
    };

    const containerStyles = {
        success: 'border-emerald-200 bg-white/95 backdrop-blur shadow-lg shadow-emerald-100/40',
        error: 'border-rose-200 bg-white/95 backdrop-blur shadow-lg shadow-rose-100/40',
        warning: 'border-amber-200 bg-white/95 backdrop-blur shadow-lg shadow-amber-100/40',
        info: 'border-blue-200 bg-white/95 backdrop-blur shadow-lg shadow-blue-100/40',
    } as const;

    const titleColors = {
        success: 'text-emerald-700',
        error: 'text-rose-700',
        warning: 'text-amber-700',
        info: 'text-blue-700',
    } as const;

    const descriptionColors = {
        success: 'text-emerald-600',
        error: 'text-rose-600',
        warning: 'text-amber-600',
        info: 'text-blue-600',
    } as const;

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed top-6 right-6 z-[9999] flex w-full max-w-sm flex-col gap-3">
                {toasts.map(({ id, title, description, type = 'info' }) => (
                    <div
                        key={id}
                        className={`pointer-events-auto overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${containerStyles[type]}`}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">{renderIcon(type)}</div>
                            <div className="flex-1">
                                <p className={`text-sm font-semibold ${titleColors[type]}`}>{title}</p>
                                {description && (
                                    <p className={`mt-1 text-xs leading-relaxed ${descriptionColors[type]}`}>{description}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => dismissToast(id)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                                aria-label="Dismiss notification"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
