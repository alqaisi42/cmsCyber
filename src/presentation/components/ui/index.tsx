// src/presentation/components/ui/index.ts
// Modern, reusable UI components for TPA system

import React from 'react';
import { X, Check, AlertTriangle, Info, Loader2 } from 'lucide-react';
import {cn} from "../../../shared/utils/cn";

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Button({
                           variant = 'primary',
                           size = 'md',
                           isLoading = false,
                           leftIcon,
                           rightIcon,
                           children,
                           className,
                           disabled,
                           ...props
                       }: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
        secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-blue-500',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2'
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
    disabled={disabled || isLoading}
    {...props}
>
    {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
    ) : leftIcon}
    {children}
    {!isLoading && rightIcon}
    </button>
);
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
    const variants = {
        default: 'bg-slate-100 text-slate-700 border-slate-200',
        success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        danger: 'bg-red-100 text-red-700 border-red-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base'
    };

    return (
        <span className={cn('inline-flex items-center font-semibold rounded-full border', variants[variant], sizes[size], className)}>
    {children}
    </span>
);
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: boolean;
    hover?: boolean;
}

export function Card({ children, className, padding = true, hover = false }: CardProps) {
    return (
        <div className={cn(
            'bg-white rounded-2xl shadow-sm border border-slate-200',
            padding && 'p-6',
        hover && 'hover:shadow-md transition-shadow cursor-pointer',
            className
    )}>
    {children}
    </div>
);
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-b border-slate-200', className)}>
    {children}
    </div>
);
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('p-6', className)}>
    {children}
    </div>
);
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-t border-slate-200 bg-slate-50', className)}>
    {children}
    </div>
);
}

// ============================================================================
// ALERT COMPONENT
// ============================================================================

export interface AlertProps {
    variant?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
    const variants = {
        info: {
            container: 'bg-blue-50 border-blue-200',
            icon: <Info className="w-5 h-5 text-blue-600" />,
            title: 'text-blue-900',
            text: 'text-blue-700'
        },
        success: {
            container: 'bg-emerald-50 border-emerald-200',
            icon: <Check className="w-5 h-5 text-emerald-600" />,
            title: 'text-emerald-900',
            text: 'text-emerald-700'
        },
        warning: {
            container: 'bg-amber-50 border-amber-200',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
            title: 'text-amber-900',
            text: 'text-amber-700'
        },
        error: {
            container: 'bg-red-50 border-red-200',
            icon: <X className="w-5 h-5 text-red-600" />,
            title: 'text-red-900',
            text: 'text-red-700'
        }
    };

    const config = variants[variant];

    return (
        <div className={cn('p-4 rounded-xl border flex items-start gap-3', config.container, className)}>
    <div className="flex-shrink-0 mt-0.5">
        {config.icon}
        </div>
        <div className="flex-1">
        {title && (
            <h4 className={cn('font-semibold mb-1', config.title)}>
    {title}
    </h4>
)}
    <div className={cn('text-sm', config.text)}>
    {children}
    </div>
    </div>
    {onClose && (
        <button
            onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
        <X className="w-4 h-4" />
            </button>
    )}
    </div>
);
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftIcon, rightIcon, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {label}
        {props.required && <span className="text-red-600 ml-1">*</span>}
            </label>
        )}

        <div className="relative">
            {leftIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {leftIcon}
                    </div>
            )}

        <input
            ref={ref}
        className={cn(
            'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            error ? 'border-red-300 bg-red-50' : 'border-slate-300',
            leftIcon && 'pl-10',
        rightIcon && 'pr-10',
            className
    )}
        {...props}
        />

        {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {rightIcon}
                </div>
        )}
        </div>

        {error && (
            <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}

        {helperText && !error && (
            <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
        </div>
    );
    }
    );

        Input.displayName = 'Input';

// ============================================================================
// SELECT COMPONENT
// ============================================================================

        export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
            label?: string;
            error?: string;
            helperText?: string;
            options: Array<{ value: string; label: string }>;
        }

        export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
            ({ label, error, helperText, options, className, ...props }, ref) => {
                return (
                    <div className="w-full">
                        {label && (
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {label}
                {props.required && <span className="text-red-600 ml-1">*</span>}
                    </label>
                )}

                <select
                    ref={ref}
                className={cn(
                    'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white',
                    error ? 'border-red-300 bg-red-50' : 'border-slate-300',
                    className
            )}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                    {option.label}
                    </option>
                ))}
                </select>

                {error && (
                    <p className="mt-1.5 text-sm text-red-600">{error}</p>
                )}

                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
                )}
                </div>
            );
            }
            );

                Select.displayName = 'Select';

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

                export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
                    label?: string;
                    error?: string;
                    helperText?: string;
                }

                export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
                    ({ label, error, helperText, className, ...props }, ref) => {
                        return (
                            <div className="w-full">
                                {label && (
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {label}
                        {props.required && <span className="text-red-600 ml-1">*</span>}
                            </label>
                        )}

                        <textarea
                            ref={ref}
                        className={cn(
                            'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none',
                            error ? 'border-red-300 bg-red-50' : 'border-slate-300',
                            className
                    )}
                        {...props}
                        />

                        {error && (
                            <p className="mt-1.5 text-sm text-red-600">{error}</p>
                        )}

                        {helperText && !error && (
                            <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
                        )}
                        </div>
                    );
                    }
                    );

                        Textarea.displayName = 'Textarea';

// ============================================================================
// LOADING SPINNER
// ============================================================================

                        export interface SpinnerProps {
                            size?: 'sm' | 'md' | 'lg';
                            className?: string;
                        }

                        export function Spinner({ size = 'md', className }: SpinnerProps) {
                            const sizes = {
                                sm: 'w-4 h-4',
                                md: 'w-6 h-6',
                                lg: 'w-8 h-8'
                            };

                            return (
                                <Loader2 className={cn('animate-spin text-blue-600', sizes[size], className)} />
                        );
                        }

                        export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
                            return (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
                                <Spinner size="lg" />
                                <p className="text-slate-700 font-medium">{message}</p>
                                    </div>
                                    </div>
                            );
                        }

// ============================================================================
// EMPTY STATE
// ============================================================================

                        export interface EmptyStateProps {
                            icon?: React.ReactNode;
                            title: string;
                            description?: string;
                            action?: {
                                label: string;
                                onClick: () => void;
                            };
                        }

                        export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
                            return (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    {icon && (
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                                            {icon}
                                            </div>
                                    )}
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {title}
                                </h3>
                            {description && (
                                <p className="text-sm text-slate-600 max-w-md mb-6">
                                    {description}
                                    </p>
                            )}
                            {action && (
                                <Button onClick={action.onClick}>
                                    {action.label}
                                    </Button>
                            )}
                            </div>
                        );
                        }

// ============================================================================
// PROGRESS BAR
// ============================================================================

                        export interface ProgressBarProps {
                            value: number;
                            max?: number;
                            label?: string;
                            showPercentage?: boolean;
                            size?: 'sm' | 'md' | 'lg';
                            variant?: 'primary' | 'success' | 'warning' | 'danger';
                        }

                        export function ProgressBar({
                                                        value,
                                                        max = 100,
                                                        label,
                                                        showPercentage = true,
                                                        size = 'md',
                                                        variant = 'primary'
                                                    }: ProgressBarProps) {
                            const percentage = Math.min((value / max) * 100, 100);

                            const sizes = {
                                sm: 'h-1',
                                md: 'h-2',
                                lg: 'h-3'
                            };

                            const variants = {
                                primary: 'bg-blue-600',
                                success: 'bg-emerald-600',
                                warning: 'bg-amber-600',
                                danger: 'bg-red-600'
                            };

                            return (
                                <div className="w-full">
                                    {(label || showPercentage) && (
                                        <div className="flex items-center justify-between mb-2">
                                        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
                            {showPercentage && (
                                <span className="text-sm font-semibold text-slate-900">
                                    {Math.round(percentage)}%
                                    </span>
                            )}
                            </div>
                        )}
                            <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden', sizes[size])}>
                            <div
                                className={cn('h-full rounded-full transition-all duration-300', variants[variant])}
                            style={{ width: `${percentage}%` }}
                            />
                            </div>
                            </div>
                        );
                        }

// ============================================================================
// TOOLTIP (Simple version)
// ============================================================================

                            export interface TooltipProps {
                                content: string;
                                children: React.ReactNode;
                                position?: 'top' | 'bottom' | 'left' | 'right';
                            }

                            export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
                                const [show, setShow] = React.useState(false);

                                return (
                                    <div className="relative inline-block">
                                    <div
                                        onMouseEnter={() => setShow(true)}
                                onMouseLeave={() => setShow(false)}
                            >
                                {children}
                                </div>
                                {show && (
                                    <div className={cn(
                                        'absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap',
                                        position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
                                    position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
                                    position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
                                    position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2'
                                )}>
                                    {content}
                                    </div>
                                )}
                                </div>
                            );
                            }