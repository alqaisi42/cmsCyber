'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Store,
    Mail,
    Phone,
    Globe,
    Building2,
    MapPin,
    Percent,
    Loader2,
    Save,
} from 'lucide-react';
import clsx from 'clsx';

const optionalStringField = z.preprocess((value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
}, z.string().optional());

const optionalUrlField = z.preprocess((value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
}, z
    .string()
    .url('Please provide a valid URL (https://...)')
    .optional());

const optionalNumberField = z.preprocess((value) => {
    if (typeof value === 'number') {
        return Number.isNaN(value) ? undefined : value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}, z.number().optional());

const latitudeField = optionalNumberField.refine(
    (value) => value === undefined || (value >= -90 && value <= 90),
    { message: 'Latitude must be between -90 and 90' },
);

const longitudeField = optionalNumberField.refine(
    (value) => value === undefined || (value >= -180 && value <= 180),
    { message: 'Longitude must be between -180 and 180' },
);

const ratingField = optionalNumberField.refine(
    (value) => value === undefined || (value >= 0 && value <= 5),
    { message: 'Rating must be between 0 and 5' },
);

const commissionField = z.preprocess((value) => {
    if (typeof value === 'number') {
        return Number.isNaN(value) ? undefined : value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
},
z
    .number({
        required_error: 'Commission percentage is required',
        invalid_type_error: 'Commission percentage is required',
    })
    .min(0, 'Commission must be at least 0%')
    .max(100, 'Commission cannot exceed 100%'));

const providerFormSchema = z.object({
    name: z.string().min(3, 'Provider name must be at least 3 characters'),
    logoUrl: optionalUrlField,
    contactEmail: z.string().email('Please provide a valid contact email'),
    contactPhone: optionalStringField,
    website: optionalUrlField,
    description: optionalStringField,
    businessRegistrationNumber: optionalStringField,
    taxNumber: optionalStringField,
    commissionPercentage: commissionField,
    isActive: z.boolean().default(true),
    rating: ratingField,
    address: z.object({
        street: z.string().min(1, 'Street address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State / Governorate is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        latitude: latitudeField,
        longitude: longitudeField,
    }),
});

export type ProviderFormValues = z.infer<typeof providerFormSchema>;

interface ProviderFormProps {
    mode: 'create' | 'edit';
    defaultValues?: Partial<ProviderFormValues>;
    onSubmit: (values: ProviderFormValues) => Promise<void> | void;
    isSubmitting?: boolean;
    serverError?: string | null;
    onCancel?: () => void;
}

export function ProviderForm({
    mode,
    defaultValues,
    onSubmit,
    isSubmitting,
    serverError,
    onCancel,
}: ProviderFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ProviderFormValues>({
        resolver: zodResolver(providerFormSchema),
        defaultValues: {
            name: defaultValues?.name ?? '',
            logoUrl: defaultValues?.logoUrl ?? '',
            contactEmail: defaultValues?.contactEmail ?? '',
            contactPhone: defaultValues?.contactPhone ?? '',
            website: defaultValues?.website ?? '',
            description: defaultValues?.description ?? '',
            businessRegistrationNumber: defaultValues?.businessRegistrationNumber ?? '',
            taxNumber: defaultValues?.taxNumber ?? '',
            commissionPercentage: defaultValues?.commissionPercentage ?? 0,
            isActive: defaultValues?.isActive ?? true,
            rating: defaultValues?.rating,
            address: {
                street: defaultValues?.address?.street ?? '',
                city: defaultValues?.address?.city ?? '',
                state: defaultValues?.address?.state ?? '',
                postalCode: defaultValues?.address?.postalCode ?? '',
                country: defaultValues?.address?.country ?? '',
                latitude: defaultValues?.address?.latitude,
                longitude: defaultValues?.address?.longitude,
            },
        },
    });

    const isActive = watch('isActive');

    const sectionClassName = useMemo(
        () =>
            'rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm p-6 space-y-5',
        [],
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <p className="font-semibold">{serverError}</p>
                    <p className="text-sm text-red-600/80">
                        Please review the highlighted fields or try again in a moment.
                    </p>
                </div>
            ) : null}

            <section className={sectionClassName}>
                <header className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                        <Store className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                        <p className="text-sm text-slate-500">
                            Define how the provider appears across the marketplace.
                        </p>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Provider Name *</label>
                        <input
                            type="text"
                            {...register('name')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.name
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="e.g. Nike Sports"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Logo URL</label>
                        <input
                            type="url"
                            {...register('logoUrl')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.logoUrl
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="https://example.com/logo.png"
                        />
                        {errors.logoUrl && (
                            <p className="mt-1 text-xs text-red-600">{errors.logoUrl.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                        rows={4}
                        {...register('description')}
                        className={clsx(
                            'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                            errors.description
                                ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                        )}
                        placeholder="Summarize the provider brand, assortment, and unique positioning"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                    )}
                </div>
            </section>

            <section className={sectionClassName}>
                <header className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                        <Mail className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Contact Channels</h2>
                        <p className="text-sm text-slate-500">Keep contact points current for smooth collaboration.</p>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Contact Email *</label>
                        <div className="relative mt-1">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                {...register('contactEmail')}
                                className={clsx(
                                    'w-full rounded-lg border px-3 py-2 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2',
                                    errors.contactEmail
                                        ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                                )}
                                placeholder="contact@brand.com"
                            />
                        </div>
                        {errors.contactEmail && (
                            <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Contact Phone</label>
                        <div className="relative mt-1">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="tel"
                                {...register('contactPhone')}
                                className={clsx(
                                    'w-full rounded-lg border px-3 py-2 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2',
                                    errors.contactPhone
                                        ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                                )}
                                placeholder="+962791234567"
                            />
                        </div>
                        {errors.contactPhone && (
                            <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Website</label>
                        <div className="relative mt-1">
                            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="url"
                                {...register('website')}
                                className={clsx(
                                    'w-full rounded-lg border px-3 py-2 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2',
                                    errors.website
                                        ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                                )}
                                placeholder="https://brand.com"
                            />
                        </div>
                        {errors.website && (
                            <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Provider Status</label>
                        <label className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="text-sm font-medium text-slate-600">
                                {isActive ? 'Currently Active' : 'Currently Inactive'}
                            </span>
                            <span className="flex items-center gap-3">
                                <span
                                    className={clsx(
                                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
                                        isActive ? 'bg-emerald-500' : 'bg-slate-300',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        {...register('isActive')}
                                        className="sr-only"
                                    />
                                    <span
                                        className={clsx(
                                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                            isActive ? 'translate-x-5' : 'translate-x-1',
                                        )}
                                    />
                                </span>
                                <span className={clsx('text-xs font-semibold uppercase', isActive ? 'text-emerald-600' : 'text-slate-400')}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            <section className={sectionClassName}>
                <header className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Business Profile</h2>
                        <p className="text-sm text-slate-500">
                            Legal information helps us verify and onboard the provider smoothly.
                        </p>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Business Registration Number</label>
                        <input
                            type="text"
                            {...register('businessRegistrationNumber')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.businessRegistrationNumber
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="BR123456789"
                        />
                        {errors.businessRegistrationNumber && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.businessRegistrationNumber.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Tax Number</label>
                        <input
                            type="text"
                            {...register('taxNumber')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.taxNumber
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="TAX987654321"
                        />
                        {errors.taxNumber && (
                            <p className="mt-1 text-xs text-red-600">{errors.taxNumber.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Commission Percentage *</label>
                        <div className="relative mt-1">
                            <Percent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                {...register('commissionPercentage', { valueAsNumber: true })}
                                className={clsx(
                                    'w-full rounded-lg border px-3 py-2 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2',
                                    errors.commissionPercentage
                                        ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                                )}
                                placeholder="15.5"
                            />
                        </div>
                        {errors.commissionPercentage && (
                            <p className="mt-1 text-xs text-red-600">{errors.commissionPercentage.message}</p>
                        )}
                    </div>

                    {mode === 'edit' ? (
                        <div>
                            <label className="text-sm font-medium text-slate-700">Customer Rating</label>
                            <div className="relative mt-1">
                                <svg
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.118 3.442a1 1 0 00.95.69h3.62c.969 0 1.371 1.24.588 1.81l-2.93 2.13a1 1 0 00-.363 1.118l1.118 3.443c.3.921-.755 1.688-1.54 1.118l-2.93-2.13a1 1 0 00-1.176 0l-2.93 2.13c-.784.57-1.838-.197-1.539-1.118l1.118-3.443a1 1 0 00-.363-1.118l-2.93-2.13c-.783-.57-.38-1.81.588-1.81h3.62a1 1 0 00.95-.69l1.118-3.442z" />
                                </svg>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    {...register('rating', { valueAsNumber: true })}
                                    className={clsx(
                                        'w-full rounded-lg border px-3 py-2 pl-9 text-sm shadow-sm focus:outline-none focus:ring-2',
                                        errors.rating
                                            ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                            : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                                    )}
                                    placeholder="4.5"
                                />
                            </div>
                            {errors.rating && (
                                <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>
                            )}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className={sectionClassName}>
                <header className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Physical Address</h2>
                        <p className="text-sm text-slate-500">
                            We use this for logistics planning and geo-aware customer experiences.
                        </p>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Street *</label>
                        <input
                            type="text"
                            {...register('address.street')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.street
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="123 Sports Avenue"
                        />
                        {errors.address?.street?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.street?.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">City *</label>
                        <input
                            type="text"
                            {...register('address.city')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.city
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="Amman"
                        />
                        {errors.address?.city?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.city?.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="text-sm font-medium text-slate-700">State / Governorate *</label>
                        <input
                            type="text"
                            {...register('address.state')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.state
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="Amman Governorate"
                        />
                        {errors.address?.state?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.state?.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Postal Code *</label>
                        <input
                            type="text"
                            {...register('address.postalCode')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.postalCode
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="11181"
                        />
                        {errors.address?.postalCode?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.postalCode?.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Country *</label>
                        <input
                            type="text"
                            {...register('address.country')}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.country
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="Jordan"
                        />
                        {errors.address?.country?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.country?.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Latitude</label>
                        <input
                            type="number"
                            step="0.0001"
                            {...register('address.latitude', { valueAsNumber: true })}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.latitude
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="31.9522"
                        />
                        {errors.address?.latitude?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.latitude?.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Longitude</label>
                        <input
                            type="number"
                            step="0.0001"
                            {...register('address.longitude', { valueAsNumber: true })}
                            className={clsx(
                                'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
                                errors.address?.longitude
                                    ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                                    : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200',
                            )}
                            placeholder="35.9106"
                        />
                        {errors.address?.longitude?.message && (
                            <p className="mt-1 text-xs text-red-600">{errors.address?.longitude?.message}</p>
                        )}
                    </div>
                </div>
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        {mode === 'create' ? 'Create provider profile' : 'Update provider profile'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Changes go live immediately for storefronts and merchandising teams.
                    </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {onCancel ? (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx(
                            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70',
                            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700',
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {mode === 'create' ? 'Create Provider' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
