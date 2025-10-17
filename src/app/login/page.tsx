// src/app/login/page.tsx
// Simple mock login for development/testing

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../presentation/contexts/auth-store';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [email, setEmail] = useState('admin@3lababee.com');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 🚨 MOCK LOGIN - Replace with real API call
            // For now, accept any password
            const mockUser = {
                id: '1',
                email: email,
                name: 'Admin User',
                role: 'ADMIN'
            };

            const mockToken = 'mock-jwt-token-' + Date.now();

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Set auth in store
            setAuth(mockUser, mockToken);

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">3L</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                {/* Mock Warning */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Mock Login</strong> - For testing only.
                        Any password will work.
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="admin@3lababee.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Enter any password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>Test with any email/password combination</p>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>© 2025 3lababee Admin. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}