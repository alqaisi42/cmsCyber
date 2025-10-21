// src/presentation/components/users/UserDetailsDrawer.tsx

'use client';

import { X, Calendar, Clock4, Globe, Lock, Mail, Phone, Shield, ShieldCheck, Smartphone, UserCheck, UserCircle2 } from 'lucide-react';
import { AdminUser } from '../../../infrastructure/services/admin.service';
import { cn, formatDate } from '../../../shared/utils/cn';

interface UserDetailsDrawerProps {
    user: AdminUser | null;
    open: boolean;
    onClose: () => void;
    onEdit?: (user: AdminUser) => void;
    onResetPassword?: (user: AdminUser) => void;
}

export default function UserDetailsDrawer({ user, open, onClose, onEdit, onResetPassword }: UserDetailsDrawerProps) {
    if (!user || !open) {
        return null;
    }

    const statusLabel = user.isActive ? 'Active' : user.lockedUntil ? 'Locked' : 'Inactive';
    const statusTone = user.isActive ? 'bg-green-100 text-green-700' : user.lockedUntil ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';

    return (
        <div className="fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/40" onClick={onClose} aria-hidden="true" />
            <aside className="relative flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">User profile</p>
                        <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', statusTone)}>
                                {statusLabel}
                            </span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {user.role.replace('_', ' ')}
                            </span>
                            {user.twoFactorEnabled && (
                                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                                    <Shield className="h-3 w-3" />
                                    2FA enabled
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100" aria-label="Close details">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-6">
                    <section className="mb-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Contact</p>
                            <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{user.email}</span>
                                </div>
                                {user.phoneNumber && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{user.phoneNumber}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <span>{user.locale ?? 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Security</p>
                            <div className="mt-3 space-y-2 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={`h-4 w-4 ${user.emailVerified ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span>Email verified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Smartphone className={`h-4 w-4 ${user.phoneVerified ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span>Phone verified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Lock className={`h-4 w-4 ${user.lockedUntil ? 'text-red-500' : 'text-gray-300'}`} />
                                    <span>
                                        {user.lockedUntil
                                            ? `Locked until ${formatDate(user.lockedUntil, 'time')}`
                                            : 'Not locked'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Activity</p>
                        <div className="mt-3 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>Created {formatDate(user.createdAt, 'time')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock4 className="h-4 w-4 text-gray-400" />
                                <span>
                                    Last login {user.lastLoginAt ? formatDate(user.lastLoginAt, 'time') : 'Never'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserCircle2 className="h-4 w-4 text-gray-400" />
                                <span>{user.socialProvider ? `Signed in via ${user.socialProvider}` : 'Email/password account'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-gray-400" />
                                <span>{user.hasFcmToken ? 'Push notifications enabled' : 'No push token'}</span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Login health</p>
                        <div className="mt-3 grid gap-3 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>Failed login attempts</span>
                                <span className="font-semibold">{user.loginAttempts}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Email OTP attempts</span>
                                <span className="font-semibold">{user.emailVerificationAttempts}</span>
                            </div>
                            {user.emailVerificationOtpExpiresAt && (
                                <div className="flex justify-between">
                                    <span>OTP expires</span>
                                    <span className="font-semibold">{formatDate(user.emailVerificationOtpExpiresAt, 'time')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Last login IP</span>
                                <span className="font-semibold">{user.lastLoginIp ?? 'Unknown'}</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-auto border-t bg-gray-50 px-6 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {onResetPassword && (
                            <button
                                onClick={() => onResetPassword(user)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white"
                            >
                                Send reset password
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(user)}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Edit user
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}
