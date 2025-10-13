'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../presentation/hooks/useAuth';
import { cn } from '../../shared/utils/cn';
import { MOCK_CREDENTIALS } from '../../infrastructure/api/mock-auth.service';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, loading, error: authError } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await login(formData);
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleQuickLogin = (role: 'admin' | 'manager' | 'user') => {
        const credentials = MOCK_CREDENTIALS[role];
        setFormData({
            email: credentials.email,
            password: credentials.password,
        });
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">3L</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600">
                        Sign in to 3lababee Admin Portal
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {authError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {authError}
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="admin@3lababee.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                                disabled={loading}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                'w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium',
                                'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                'flex items-center justify-center gap-2'
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Quick Login (Demo Mode)
                        </p>

                        <div className="space-y-2">
                            {Object.entries(MOCK_CREDENTIALS).map(([role, creds]) => (
                                <div
                                    key={role}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-700 uppercase mb-1">
                                            {role}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <span className="font-mono">{creds.email}</span>
                                            <button
                                                onClick={() => copyToClipboard(creds.email, `${role}-email`)}
                                                className="text-blue-600 hover:text-blue-700"
                                                title="Copy email"
                                            >
                                                {copiedField === `${role}-email` ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <span className="font-mono">{creds.password}</span>
                                            <button
                                                onClick={() => copyToClipboard(creds.password, `${role}-pass`)}
                                                className="text-blue-600 hover:text-blue-700"
                                                title="Copy password"
                                            >
                                                {copiedField === `${role}-pass` ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin(role as 'admin' | 'manager' | 'user')}
                                        disabled={loading}
                                        className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Use
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600 mt-8">
                    © 2025 3lababee. All rights reserved.
                </p>
            </div>
        </div>
    );
}