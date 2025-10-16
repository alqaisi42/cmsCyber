// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Globe, AlertCircle } from 'lucide-react';
import { useAuthStore } from "../../presentation/contexts/auth-store";
import { User as UserType, UserRole, UserStatus } from '../../core/entities';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        language: 'en'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simple validation for demo/3lababee system
            if (formData.username === 'demo' && formData.password === 'demo123') {
                // Create a proper User object matching the User type
                const user: UserType = {
                    id: '1',
                    email: 'demo@3lababee.com', // Required field
                    name: 'Demo User',
                    role: UserRole.USER, // Regular user role
                    status: UserStatus.ACTIVE, // Required field
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date(),
                    phone: '+962-79-1234567',
                    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff'
                };

                // Store in localStorage for persistence
                localStorage.setItem('token', 'mock-jwt-token');
                localStorage.setItem('user', JSON.stringify(user));

                // Set auth in store
                setAuth(user, 'mock-jwt-token');

                // Set cookie for middleware
                document.cookie = 'token=mock-jwt-token; path=/';

                // Redirect to dashboard
                router.push('/dashboard');
                router.refresh();
            } else if (formData.username === 'admin' && formData.password === 'admin123') {
                // Admin user for 3lababee system
                const user: UserType = {
                    id: '2',
                    email: 'admin@3lababee.com',
                    name: 'Admin User',
                    role: UserRole.ADMIN,
                    status: UserStatus.ACTIVE,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date(),
                    phone: '+962-79-9876543',
                    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff'
                };

                localStorage.setItem('token', 'admin-jwt-token');
                localStorage.setItem('user', JSON.stringify(user));
                setAuth(user, 'admin-jwt-token');
                document.cookie = 'token=admin-jwt-token; path=/';
                router.push('/dashboard');
                router.refresh();
            } else {
                setError('Invalid username or password. Use demo/demo123 or admin/admin123');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">3L</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to 3lababee</h1>
                    <p className="text-gray-600 mt-2">Admin Management Portal</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                    {/* Demo Credentials Info */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p>User: <span className="font-mono">demo / demo123</span></p>
                            <p>Admin: <span className="font-mono">admin / admin123</span></p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Username Field */}
                    <div className="mb-6">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Enter your username"
                                required
                                readOnly={isLoading}

                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Enter your password"
                                required
                                readOnly={isLoading}

                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div className="mb-6">
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                id="language"
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none bg-white"
                                disabled={isLoading}
                            >
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                            </select>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-600">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-600">
                        © 2024 3lababee. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}