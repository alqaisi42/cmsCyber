// src/presentation/components/providers/ProviderForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Image as ImageIcon, Save } from 'lucide-react';

import { Provider } from '../../../core/entities';
import { useCreateProvider, useUpdateProvider } from '../../hooks/useProviders';
import { Button } from '../ui';

interface ProviderFormProps {
    provider?: Provider;
    mode: 'create' | 'edit';
    onSuccess?: (provider: Provider) => void;
}

export function ProviderForm({ provider, mode, onSuccess }: ProviderFormProps) {
    const router = useRouter();
    const createProvider = useCreateProvider();
    const updateProvider = useUpdateProvider();

    const [formState, setFormState] = useState({
        name: provider?.name || '',
        logoUrl: provider?.logoUrl || '',
        isActive: provider?.isActive ?? true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: 'name' | 'logoUrl' | 'isActive', value: string | boolean) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const validationErrors: Record<string, string> = {};

        if (!formState.name.trim()) {
            validationErrors.name = 'Provider name is required';
        }

        if (formState.logoUrl && !/^https?:\/\//i.test(formState.logoUrl)) {
            validationErrors.logoUrl = 'Logo URL must be a valid URL';
        }

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validate()) return;

        try {
            if (mode === 'create') {
                const created = await createProvider.mutateAsync({
                    name: formState.name.trim(),
                    logoUrl: formState.logoUrl.trim(),
                    isActive: formState.isActive,
                });
                alert('Provider created successfully');
                onSuccess?.(created);
                router.push(`/dashboard/providers/${created.id}`);
            } else if (provider) {
                const updated = await updateProvider.mutateAsync({
                    id: provider.id,
                    data: {
                        name: formState.name.trim(),
                        logoUrl: formState.logoUrl.trim(),
                        isActive: formState.isActive,
                    },
                });
                alert('Provider updated successfully');
                onSuccess?.(updated);
                router.refresh();
            }
        } catch (error: any) {
            alert(error.message || 'Failed to save provider');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {formState.logoUrl ? (
                            <img src={formState.logoUrl} alt={formState.name} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            {mode === 'create' ? 'New Provider' : provider?.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Provide essential details to manage this provider and their catalog.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Provider Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={formState.name}
                                onChange={(event) => handleChange('name', event.target.value)}
                                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g. Nike"
                            />
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                        <input
                            type="url"
                            value={formState.logoUrl}
                            onChange={(event) => handleChange('logoUrl', event.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.logoUrl ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="https://..."
                        />
                        {errors.logoUrl && <p className="mt-1 text-xs text-red-600">{errors.logoUrl}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="provider-active"
                        checked={formState.isActive}
                        onChange={(event) => handleChange('isActive', event.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="provider-active" className="text-sm font-medium text-gray-700">
                        Provider is active and visible to customers
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<Save className="w-4 h-4" />}
                    isLoading={createProvider.isPending || updateProvider.isPending}
                >
                    {mode === 'create' ? 'Create Provider' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
