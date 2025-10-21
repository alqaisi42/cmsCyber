// src/presentation/components/users/UserFormModal.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, UserPlus, UserCog, Mail, Phone, ShieldCheck, Lock, Unlock, Loader2 } from 'lucide-react';
import { AdminUser } from '../../../infrastructure/services/admin.service';
import { isValidEmail, isValidPhone } from '../../../shared/utils/cn';

export type UserFormMode = 'create' | 'edit';

export interface UserFormValues {
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    password: string;
    confirmPassword: string;
}

interface UserFormModalProps {
    mode: UserFormMode;
    open: boolean;
    onClose: () => void;
    onSubmit: (values: UserFormValues) => Promise<void>;
    initialData?: Partial<AdminUser> | null;
    loading?: boolean;
}

const defaultValues: UserFormValues = {
    name: '',
    email: '',
    phoneNumber: '',
    role: 'USER',
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    password: '',
    confirmPassword: '',
};

const roles = ['ADMIN', 'USER', 'VENDOR', 'DELIVERY_PERSON'];

export function UserFormModal({
    mode,
    open,
    onClose,
    onSubmit,
    initialData,
    loading = false,
}: UserFormModalProps) {
    const [values, setValues] = useState<UserFormValues>(defaultValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isEdit = mode === 'edit';

    useEffect(() => {
        if (open) {
            if (initialData) {
                setValues({
                    name: initialData.name ?? '',
                    email: initialData.email ?? '',
                    phoneNumber: initialData.phoneNumber ?? '',
                    role: initialData.role ?? 'USER',
                    isActive: initialData.isActive ?? true,
                    emailVerified: initialData.emailVerified ?? false,
                    phoneVerified: initialData.phoneVerified ?? false,
                    password: '',
                    confirmPassword: '',
                });
            } else {
                setValues(defaultValues);
            }
            setErrors({});
        }
    }, [open, initialData]);

    const icon = useMemo(() => (isEdit ? UserCog : UserPlus), [isEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!values.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!values.email.trim() || !isValidEmail(values.email)) {
            newErrors.email = 'A valid email address is required';
        }

        if (values.phoneNumber && !isValidPhone(values.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be in international format';
        }

        if (!roles.includes(values.role)) {
            newErrors.role = 'Please select a valid role';
        }

        if (!isEdit) {
            if (!values.password || values.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }

            if (values.password !== values.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        await onSubmit(values);
    };

    if (!open) {
        return null;
    }

    const HeaderIcon = icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white/20 p-2">
                            <HeaderIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {isEdit ? 'Update User' : 'Create New User'}
                            </h2>
                            <p className="text-sm text-white/80">
                                {isEdit ? 'Modify existing user account details' : 'Invite a new user to the platform'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 transition hover:bg-white/20"
                        aria-label="Close user form"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
                                Full Name
                            </label>
                            <div className="relative">
                                <input
                                    id="name"
                                    type="text"
                                    value={values.name}
                                    onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
                                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="John Doe"
                                />
                                <UserCog className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={values.email}
                                    onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                                    disabled={isEdit}
                                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                                    } ${isEdit ? 'bg-gray-100 text-gray-500' : ''}`}
                                    placeholder="user@example.com"
                                />
                                <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
                                Phone Number
                            </label>
                            <div className="relative">
                                <input
                                    id="phone"
                                    type="tel"
                                    value={values.phoneNumber}
                                    onChange={(event) => setValues((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.phoneNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="+962700000000"
                                />
                                <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                            {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="role">
                                Role
                            </label>
                            <select
                                id="role"
                                value={values.role}
                                onChange={(event) => setValues((prev) => ({ ...prev, role: event.target.value }))}
                                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.role ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                                }`}
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/50">
                            <input
                                type="checkbox"
                                checked={values.isActive}
                                onChange={(event) => setValues((prev) => ({ ...prev, isActive: event.target.checked }))}
                                className="h-4 w-4"
                            />
                            <div>
                                <p className="font-medium text-gray-800">Account Active</p>
                                <p className="text-sm text-gray-500">User can sign in and access the dashboard</p>
                            </div>
                            {values.isActive ? <Unlock className="ml-auto h-4 w-4 text-green-500" /> : <Lock className="ml-auto h-4 w-4 text-amber-500" />}
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/50">
                            <input
                                type="checkbox"
                                checked={values.emailVerified}
                                onChange={(event) => setValues((prev) => ({ ...prev, emailVerified: event.target.checked }))}
                                className="h-4 w-4"
                            />
                            <div>
                                <p className="font-medium text-gray-800">Email Verified</p>
                                <p className="text-sm text-gray-500">Mark email as confirmed</p>
                            </div>
                            <ShieldCheck className={`ml-auto h-4 w-4 ${values.emailVerified ? 'text-green-500' : 'text-gray-300'}`} />
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/50">
                            <input
                                type="checkbox"
                                checked={values.phoneVerified}
                                onChange={(event) => setValues((prev) => ({ ...prev, phoneVerified: event.target.checked }))}
                                className="h-4 w-4"
                            />
                            <div>
                                <p className="font-medium text-gray-800">Phone Verified</p>
                                <p className="text-sm text-gray-500">Phone number confirmed via OTP</p>
                            </div>
                            <Phone className={`ml-auto h-4 w-4 ${values.phoneVerified ? 'text-green-500' : 'text-gray-300'}`} />
                        </label>
                    </div>

                    {!isEdit && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
                                    Temporary Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type="password"
                                        value={values.password}
                                        onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                                        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="At least 8 characters"
                                    />
                                    <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={values.confirmPassword}
                                        onChange={(event) => setValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                                        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="Re-enter password"
                                    />
                                    <Unlock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <div className="text-sm text-gray-500">
                            {isEdit
                                ? 'Updated details will be applied immediately.'
                                : 'An invitation email will be sent to the user after creation.'}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isEdit ? 'Save changes' : 'Create user'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserFormModal;
