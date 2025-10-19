// src/presentation/components/users/UserLockerModal.tsx

'use client';

import { useState, useEffect } from 'react';
import {
    X, MapPin, Package, Users, Calendar, CreditCard,
    CheckCircle, XCircle, Clock, AlertCircle, Key,
    TrendingUp, Activity, Box, Share2, Lock
} from 'lucide-react';
import { lockerDashboardService } from '../../../infrastructure/services/locker-dashboard.service';
import { UserLockerDashboard } from '../../../core/entities/locker-dashboard';
import { formatDate } from '../../../shared/utils/cn';

interface UserLockerModalProps {
    userId: number;
    userName: string;
    onClose: () => void;
}

export default function UserLockerModal({ userId, userName, onClose }: UserLockerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboard, setDashboard] = useState<UserLockerDashboard | null>(null);
    const [activeTab, setActiveTab] = useState<'subscriptions' | 'reservations' | 'sharing' | 'status'>('subscriptions');

    useEffect(() => {
        fetchLockerDashboard();
    }, [userId]);

    const fetchLockerDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await lockerDashboardService.getUserLockerDashboard(userId, userName);
            if (response.success) {
                setDashboard(response.data);
            } else {
                setError(response.message || 'Failed to load locker data');
            }
        } catch (err) {
            setError('Failed to fetch locker dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-green-600 bg-green-50';
            case 'INACTIVE': return 'text-gray-600 bg-gray-50';
            case 'SUSPENDED': return 'text-red-600 bg-red-50';
            case 'EXPIRED': return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getSizeIcon = (size: string) => {
        switch (size) {
            case 'SMALL': return '📦';
            case 'MEDIUM': return '📦📦';
            case 'LARGE': return '📦📦📦';
            default: return '📦';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Box className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{userName}'s Locker Dashboard</h2>
                            {dashboard && (
                                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                      {dashboard.user.totalSubscriptions} Subscriptions
                  </span>
                                    <span className="flex items-center gap-1">
                    <Share2 className="w-4 h-4" />
                                        {dashboard.user.totalSharedAccess} Shared Access
                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b bg-gray-50">
                    <div className="flex gap-1 p-2">
                        {(['subscriptions', 'reservations', 'sharing', 'stats'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    activeTab === tab
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            <AlertCircle className="w-5 h-5 inline mr-2" />
                            {error}
                        </div>
                    )}

                    {dashboard && !loading && (
                        <>
                            {/* Subscriptions Tab */}
                            {activeTab === 'subscriptions' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold mb-4">Owned Subscriptions ({dashboard.ownedSubscriptions.length})</h3>

                                    {dashboard.ownedSubscriptions.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No subscriptions found</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dashboard.ownedSubscriptions.map(sub => (
                                                <div key={sub.id} className="border rounded-xl p-4 hover:shadow-lg transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-lg">{sub.plan.name}</h4>
                                                            <p className="text-sm text-gray-500">{sub.plan.code}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                              {sub.status}
                            </span>
                                                    </div>

                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                                            <div>
                                                                <div className="font-medium">{sub.location.name}</div>
                                                                <div className="text-gray-500">{sub.location.address}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                ${sub.billingCycle === 'MONTHLY' ? sub.plan.monthlyPrice : sub.plan.annualPrice}/
                                  {sub.billingCycle.toLowerCase()}
                              </span>
                                                            <span className="flex items-center gap-1">
                                <Box className="w-4 h-4 text-gray-400" />
                                                                {sub.currentUsage}/{sub.plan.capacity} used
                              </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-600">
                                {formatDate(new Date(sub.startDate))} - {formatDate(new Date(sub.endDate))}
                              </span>
                                                        </div>

                                                        {sub.autoRenew && (
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span className="text-sm">Auto-renewal enabled</span>
                                                            </div>
                                                        )}

                                                        {sub.sharedWith.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Users className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm font-medium">Shared with {sub.sharedWith.length} users</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {sub.sharedWith.map(user => (
                                                                        <span key={user.userId} className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                                      {user.name} ({user.sharingType})
                                    </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reservations Tab */}
                            {activeTab === 'reservations' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">
                                            Active Reservations ({dashboard.activeReservations.length})
                                        </h3>
                                        {dashboard.activeReservations.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">No active reservations</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {dashboard.activeReservations.map(res => (
                                                    <div key={res.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <span className="text-2xl">{getSizeIcon(res.locker.size)}</span>
                                                                    <div>
                                                                        <div className="font-medium">{res.locker.name}</div>
                                                                        <div className="text-sm text-gray-500">{res.locker.code}</div>
                                                                    </div>
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                        res.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                    {res.status}
                                  </span>
                                                                </div>

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-500">Location:</span>
                                                                        <div className="font-medium">{res.location.name}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Type:</span>
                                                                        <div className="font-medium">{res.reservationType.replace(/_/g, ' ')}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Duration:</span>
                                                                        <div className="font-medium">
                                                                            {formatDate(new Date(res.reservedFrom), 'time')} -
                                                                            {formatDate(new Date(res.reservedUntil), 'time')}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Access Code:</span>
                                                                        <div className="font-medium flex items-center gap-1">
                                                                            <Key className="w-4 h-4" />
                                                                            {res.accessCode}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sharing Tab */}
                            {activeTab === 'sharing' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Family Members & Sharing ({dashboard.familyMembers.length})
                                    </h3>

                                    {dashboard.familyMembers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No shared members</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                <tr className="border-b bg-gray-50">
                                                    <th className="text-left p-3 font-medium">Member</th>
                                                    <th className="text-left p-3 font-medium">Subscription</th>
                                                    <th className="text-left p-3 font-medium">Location</th>
                                                    <th className="text-left p-3 font-medium">Access Level</th>
                                                    <th className="text-left p-3 font-medium">Balance</th>
                                                    <th className="text-left p-3 font-medium">Status</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {dashboard.familyMembers.map((member, idx) => (
                                                    <tr key={`${member.userId}-${idx}`} className="border-b hover:bg-gray-50">
                                                        <td className="p-3">
                                                            <div>
                                                                <div className="font-medium">{member.name}</div>
                                                                <div className="text-sm text-gray-500">{member.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-sm">{member.subscriptionName}</td>
                                                        <td className="p-3 text-sm">{member.locationName}</td>
                                                        <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    member.accessLevel === 'FULL_OWNER'
                                        ? 'bg-purple-100 text-purple-700'
                                        : member.accessLevel === 'MANAGE_SHARING'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {member.accessLevel.replace(/_/g, ' ')}
                                </span>
                                                        </td>
                                                        <td className="p-3 text-sm">
                                                            {member.allocatedBalance ?? 'Unlimited'}
                                                        </td>
                                                        <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    member.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {member.status}
                                </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Statistics Tab */}
                            {activeTab === 'stats' && dashboard.statistics && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm text-gray-600">Total Capacity</span>
                                            </div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {dashboard.statistics.totalCapacity}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {dashboard.statistics.usedCapacity} used ({Math.round((dashboard.statistics.usedCapacity / dashboard.statistics.totalCapacity) * 100)}%)
                                            </div>
                                        </div>

                                        <div className="bg-green-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <span className="text-sm text-gray-600">Active Reservations</span>
                                            </div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {dashboard.statistics.activeReservations}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                of {dashboard.statistics.totalReservations} total
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-5 h-5 text-purple-600" />
                                                <span className="text-sm text-gray-600">Family Members</span>
                                            </div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {dashboard.statistics.totalFamilyMembers}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Sharing enabled
                                            </div>
                                        </div>

                                        <div className="bg-orange-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-orange-600" />
                                                <span className="text-sm text-gray-600">Most Used</span>
                                            </div>
                                            <div className="text-lg font-bold text-orange-600">
                                                {dashboard.statistics.mostUsedSize}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                At {dashboard.statistics.mostUsedLocation}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="font-medium mb-3">Available Locations</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {dashboard.availableLocations.map(loc => (
                                                <div key={loc.location.id} className="border rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                                        <div className="flex-1">
                                                            <div className="font-medium">{loc.location.name}</div>
                                                            <div className="text-sm text-gray-500 mb-2">{loc.location.address}</div>
                                                            <div className="flex justify-between text-sm">
                                                                <span>Available: {loc.availableLockers}/{loc.totalLockers}</span>
                                                                <div className="flex gap-2">
                                                                    {Object.entries(loc.lockersBySize).map(([size, count]) => (
                                                                        <span key={size} className="text-xs">
                                      {size}: {count}
                                    </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}