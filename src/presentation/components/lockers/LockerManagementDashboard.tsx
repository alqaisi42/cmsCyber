'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AccessibleSubscription,
    CreateSubscriptionRequest,
    LockerSubscription,
    LockerSubscriptionPlan,
    ShareSubscriptionRequest,
    SubscriptionUsageResponse,
    UpdateSharingRequest,
} from '../../../core/entities/locker-subscription';
import {
    FamilyCalendarResponse,
    LockerAvailabilityRequest,
    LockerAvailabilityResult,
    LockerLocation,
    LockerReservation,
    LockerReservationRequest,
    LockerSummary,
} from '../../../core/entities/lockers';
import { useAuthStore } from '../../contexts/auth-store';
import { lockerSubscriptionService } from '../../../infrastructure/services/locker-subscription.service';
import { lockerManagementService } from '../../../infrastructure/services/locker-management.service';
import {
    ArrowUpRight,
    CalendarCheck,
    CheckCircle2,
    Clock,
    CreditCard,
    Layers,
    Loader2,
    Lock,
    MapPin,
    Plus,
    RefreshCw,
    ShieldCheck,
    Users,
    X,
    Info,
} from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'plans', label: 'Subscription Plans', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Users },
    { id: 'lockers', label: 'Lockers & Availability', icon: Lock },
    { id: 'reservations', label: 'Reservations', icon: CalendarCheck },
] as const;

type TabKey = (typeof tabs)[number]['id'];

interface LockerManagementDashboardProps {
    defaultTab?: TabKey;
}

interface ActionState {
    loading: boolean;
    message: string | null;
    error: string | null;
}

const INITIAL_SUBSCRIPTION_FORM: CreateSubscriptionRequest = {
    planId: '',
    locationId: '',
    billingCycle: 'MONTHLY',
    autoRenew: true,
    paymentMethodId: '',
};

const INITIAL_AVAILABILITY_FORM: LockerAvailabilityRequest = {
    userId: 0,
    locationId: '',
    requiredSize: 'MEDIUM',
    requestedFrom: '',
    requestedUntil: '',
    reservationType: 'DELIVERY',
};

const INITIAL_RESERVATION_FORM: LockerReservationRequest = {
    userId: 0,
    lockerId: '',
    locationId: '',
    reservedFrom: '',
    reservedUntil: '',
    reservationType: 'DELIVERY',
    notes: '',
};

export function LockerManagementDashboard({ defaultTab = 'overview' }: LockerManagementDashboardProps) {
    const { user, token } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

    const [plans, setPlans] = useState<LockerSubscriptionPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansMessage, setPlansMessage] = useState<string | null>(null);

    const [subscriptions, setSubscriptions] = useState<LockerSubscription[]>([]);
    const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
    const [accessibleSubscriptions, setAccessibleSubscriptions] = useState<AccessibleSubscription[]>([]);

    const [locations, setLocations] = useState<LockerLocation[]>([]);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [locationLockers, setLocationLockers] = useState<LockerSummary[]>([]);
    const [accessibleLockers, setAccessibleLockers] = useState<LockerSummary[]>([]);
    const [availableLockers, setAvailableLockers] = useState<LockerSummary[]>([]);

    const [reservations, setReservations] = useState<LockerReservation[]>([]);
    const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('ACTIVE');

    const [availabilityForm, setAvailabilityForm] = useState<LockerAvailabilityRequest>(INITIAL_AVAILABILITY_FORM);
    const [availabilityResult, setAvailabilityResult] = useState<LockerAvailabilityResult | null>(null);
    const [availabilityState, setAvailabilityState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [reservationForm, setReservationForm] = useState<LockerReservationRequest>(INITIAL_RESERVATION_FORM);
    const [reservationState, setReservationState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [createSubscriptionForm, setCreateSubscriptionForm] = useState<CreateSubscriptionRequest>(INITIAL_SUBSCRIPTION_FORM);
    const [createFormOpen, setCreateFormOpen] = useState(false);
    const [createState, setCreateState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [upgradePlanId, setUpgradePlanId] = useState<string>('');
    const [upgradeState, setUpgradeState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [sharingForm, setSharingForm] = useState<ShareSubscriptionRequest>({ permissions: ['VIEW', 'BOOK'] });
    const [sharingState, setSharingState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [selectedUserId, setSelectedUserId] = useState<number>(() => {
        if (user?.id) {
            const numeric = Number(user.id);
            return Number.isNaN(numeric) ? 0 : numeric;
        }
        return 0;
    });

    const [usageDetails, setUsageDetails] = useState<Record<string, SubscriptionUsageResponse>>({});
    const [calendarDetails, setCalendarDetails] = useState<Record<string, FamilyCalendarResponse>>({});
    const [calendarLoading, setCalendarLoading] = useState(false);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        setAvailabilityForm((prev) => ({ ...prev, userId: selectedUserId }));
        setReservationForm((prev) => ({ ...prev, userId: selectedUserId }));
    }, [selectedUserId]);

    useEffect(() => {
        const loadPlans = async () => {
            setPlansLoading(true);
            try {
                const response = await lockerSubscriptionService.getPlans();
                setPlans(response.data);
                setPlansMessage(response.message || null);
            } catch (error) {
                console.error('Failed to load plans:', error);
                setPlansMessage('Unable to load subscription plans.');
            } finally {
                setPlansLoading(false);
            }
        };

        const loadLocations = async () => {
            setLocationsLoading(true);
            try {
                const response = await lockerManagementService.getLocations();
                setLocations(response.data);
                setLocationsLoading(false);
            } catch (error) {
                console.error('Failed to load locations:', error);
                setLocationsLoading(false);
            }
        };

        loadPlans();
        loadLocations();
    }, []);

    useEffect(() => {
        if (!token || !selectedUserId) {
            return;
        }

        const loadSubscriptions = async () => {
            setSubscriptionsLoading(true);
            try {
                const [mySubs, accessible] = await Promise.all([
                    lockerSubscriptionService.getMySubscriptions(token),
                    lockerSubscriptionService.getAccessibleSubscriptions(token),
                ]);
                setSubscriptions(mySubs.data);
                setAccessibleSubscriptions(accessible.data);
            } catch (error) {
                console.error('Failed to load subscriptions:', error);
            } finally {
                setSubscriptionsLoading(false);
            }
        };

        const loadAccessibleLockers = async () => {
            try {
                const response = await lockerManagementService.getAccessibleLockers(selectedUserId, token);
                setAccessibleLockers(response.data);
            } catch (error) {
                console.error('Failed to load accessible lockers:', error);
            }
        };

        const loadReservations = async () => {
            try {
                const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
                setReservations(response.data);
            } catch (error) {
                console.error('Failed to load reservations:', error);
            }
        };

        loadSubscriptions();
        loadAccessibleLockers();
        loadReservations();
    }, [token, selectedUserId, reservationStatusFilter]);

    useEffect(() => {
        if (!selectedLocationId) {
            setLocationLockers([]);
            setAvailableLockers([]);
            return;
        }

        const loadLocationLockers = async () => {
            try {
                const response = await lockerManagementService.getLockersByLocation(selectedLocationId);
                setLocationLockers(response.data);
            } catch (error) {
                console.error('Failed to load lockers for location:', error);
            }
        };

        const loadAvailable = async () => {
            if (!selectedUserId) return;
            try {
                const response = await lockerManagementService.getAvailableLockersForUser(selectedUserId, selectedLocationId, token);
                setAvailableLockers(response.data);
            } catch (error) {
                console.error('Failed to load available lockers for user:', error);
            }
        };

        loadLocationLockers();
        loadAvailable();
    }, [selectedLocationId, selectedUserId, token]);

    const summaryMetrics = useMemo(() => {
        const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'ACTIVE').length;
        const sharedSubscriptions = accessibleSubscriptions.filter((sub) => sub.accessType === 'SHARED').length;
        const activeReservations = reservations.filter((res) => res.status === 'ACTIVE' || res.status === 'CONFIRMED').length;
        const availableCapacity = locations.reduce((total, loc) => total + loc.availableLockers, 0);

        return [
            {
                label: 'Active Subscriptions',
                value: activeSubscriptions,
                icon: Users,
                description: 'Owned plans currently active',
                color: 'bg-blue-50 text-blue-600',
            },
            {
                label: 'Shared Plans',
                value: sharedSubscriptions,
                icon: ShieldCheck,
                description: 'Subscriptions shared with your organisation',
                color: 'bg-indigo-50 text-indigo-600',
            },
            {
                label: 'Active Reservations',
                value: activeReservations,
                icon: Clock,
                description: 'Deliveries and pickups scheduled',
                color: 'bg-emerald-50 text-emerald-600',
            },
            {
                label: 'Available Lockers',
                value: availableCapacity,
                icon: MapPin,
                description: 'Capacity remaining across locations',
                color: 'bg-amber-50 text-amber-600',
            },
        ];
    }, [subscriptions, accessibleSubscriptions, reservations, locations]);

    const resetCreateForm = () => {
        setCreateSubscriptionForm({ ...INITIAL_SUBSCRIPTION_FORM, planId: plans[0]?.id || '', locationId: locations[0]?.id || '' });
        setCreateFormOpen(false);
    };

    const handleCreateSubscription = async () => {
        if (!token) {
            setCreateState({ loading: false, message: null, error: 'Authentication token required to create subscriptions.' });
            return;
        }

        if (!createSubscriptionForm.planId || !createSubscriptionForm.locationId) {
            setCreateState({ loading: false, message: null, error: 'Please select a plan and location.' });
            return;
        }

        setCreateState({ loading: true, message: null, error: null });
        try {
            await lockerSubscriptionService.createSubscription(createSubscriptionForm, token);
            setCreateState({ loading: false, message: 'Subscription created successfully.', error: null });
            const response = await lockerSubscriptionService.getMySubscriptions(token);
            setSubscriptions(response.data);
            resetCreateForm();
        } catch (error) {
            setCreateState({ loading: false, message: null, error: error instanceof Error ? error.message : 'Failed to create subscription.' });
        }
    };

    const handleUpgradeSubscription = async (subscriptionId: string) => {
        if (!token) {
            setUpgradeState({ loading: false, message: null, error: 'Authentication token required to upgrade subscriptions.' });
            return;
        }
        if (!upgradePlanId) {
            setUpgradeState({ loading: false, message: null, error: 'Select the new plan to upgrade to.' });
            return;
        }
        setUpgradeState({ loading: true, message: null, error: null });
        try {
            await lockerSubscriptionService.upgradeSubscription(subscriptionId, { newPlanId: upgradePlanId, effectiveImmediately: true }, token);
            setUpgradeState({ loading: false, message: 'Subscription upgraded successfully.', error: null });
            const response = await lockerSubscriptionService.getMySubscriptions(token);
            setSubscriptions(response.data);
            setUpgradePlanId('');
        } catch (error) {
            setUpgradeState({ loading: false, message: null, error: error instanceof Error ? error.message : 'Failed to upgrade subscription.' });
        }
    };

    const handleCancelSubscription = async (subscriptionId: string) => {
        if (!token) {
            alert('Authentication token required to cancel subscriptions.');
            return;
        }
        const reason = prompt('Please provide a cancellation reason');
        if (!reason) return;

        try {
            await lockerSubscriptionService.cancelSubscription(subscriptionId, reason, token);
            const response = await lockerSubscriptionService.getMySubscriptions(token);
            setSubscriptions(response.data);
            alert('Subscription cancelled successfully.');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to cancel subscription.');
        }
    };

    const handleShareSubscription = async (subscriptionId: string) => {
        if (!token) {
            setSharingState({ loading: false, message: null, error: 'Authentication token required to share subscriptions.' });
            return;
        }
        if (!sharingForm.sharedWithUserId && !sharingForm.sharedWithEmail) {
            setSharingState({ loading: false, message: null, error: 'Provide a user ID or email to share with.' });
            return;
        }

        setSharingState({ loading: true, message: null, error: null });
        try {
            await lockerSubscriptionService.shareSubscription(subscriptionId, sharingForm, token);
            setSharingState({ loading: false, message: 'Invitation sent successfully.', error: null });
            setSharingForm({ permissions: ['VIEW', 'BOOK'] });
        } catch (error) {
            setSharingState({ loading: false, message: null, error: error instanceof Error ? error.message : 'Failed to share subscription.' });
        }
    };

    const handleCheckAvailability = async () => {
        if (!availabilityForm.userId || !availabilityForm.locationId || !availabilityForm.requestedFrom || !availabilityForm.requestedUntil) {
            setAvailabilityState({ loading: false, message: null, error: 'Complete all fields to check availability.' });
            return;
        }
        setAvailabilityState({ loading: true, message: null, error: null });
        try {
            const response = await lockerManagementService.checkLockerAvailability(availabilityForm, token);
            setAvailabilityResult(response.data);
            setAvailabilityState({ loading: false, message: response.message, error: null });
        } catch (error) {
            setAvailabilityResult(null);
            setAvailabilityState({ loading: false, message: null, error: error instanceof Error ? error.message : 'Failed to check availability.' });
        }
    };

    const handleReserveLocker = async () => {
        if (!reservationForm.userId || !reservationForm.lockerId || !reservationForm.locationId || !reservationForm.reservedFrom || !reservationForm.reservedUntil) {
            setReservationState({ loading: false, message: null, error: 'Complete all required fields to reserve a locker.' });
            return;
        }
        setReservationState({ loading: true, message: null, error: null });
        try {
            const response = await lockerManagementService.reserveLocker(reservationForm, token);
            setReservationState({ loading: false, message: response.message || 'Locker reserved successfully.', error: null });
            if (selectedUserId) {
                const reservationsResponse = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
                setReservations(reservationsResponse.data);
            }
        } catch (error) {
            setReservationState({ loading: false, message: null, error: error instanceof Error ? error.message : 'Failed to reserve locker.' });
        }
    };

    const handleExtendReservation = async (reservationId: string) => {
        if (!selectedUserId) return;
        const newEndTime = prompt('New end time (ISO format, e.g. 2025-10-22T16:00:00)');
        if (!newEndTime) return;
        try {
            await lockerManagementService.extendReservation(reservationId, selectedUserId, newEndTime, token);
            const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
            setReservations(response.data);
            alert('Reservation extended.');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to extend reservation.');
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        if (!selectedUserId) return;
        try {
            await lockerManagementService.cancelReservation(reservationId, selectedUserId, token);
            const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
            setReservations(response.data);
            alert('Reservation cancelled successfully.');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to cancel reservation.');
        }
    };

    const handleLoadUsage = async (subscriptionId: string) => {
        if (usageDetails[subscriptionId] || !token) return;
        try {
            const response = await lockerSubscriptionService.getUsage(subscriptionId, token);
            setUsageDetails((prev) => ({ ...prev, [subscriptionId]: response.data }));
        } catch (error) {
            console.error('Failed to load usage stats:', error);
        }
    };

    const handleLoadCalendar = async (subscriptionId: string) => {
        if (!token) return;
        setCalendarLoading(true);
        try {
            const now = new Date();
            const startDate = new Date(now);
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 7);
            const response = await lockerManagementService.getFamilyCalendar(
                subscriptionId,
                startDate.toISOString(),
                endDate.toISOString(),
                token
            );
            setCalendarDetails((prev) => ({ ...prev, [subscriptionId]: response.data }));
        } catch (error) {
            console.error('Failed to load family calendar:', error);
        } finally {
            setCalendarLoading(false);
        }
    };

    const renderTabNavigation = () => (
        <div className="bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold',
                            isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {summaryMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div key={metric.label} className="bg-white rounded-xl shadow-sm p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{metric.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
                                    <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
                                </div>
                                <span className={cn('p-3 rounded-full', metric.color)}>
                                    <Icon className="w-5 h-5" />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Active Plans</h3>
                            <p className="text-sm text-gray-500">Quick view of active locker subscriptions</p>
                        </div>
                        <button
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onClick={() => setActiveTab('subscriptions')}
                        >
                            Manage
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {subscriptions.slice(0, 3).map((subscription) => (
                            <div key={subscription.id} className="border border-gray-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{subscription.planName}</p>
                                        <p className="text-sm text-gray-500">{subscription.locationName}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        {subscription.status}
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
                                    <div>
                                        <p className="text-gray-400">Billing</p>
                                        <p className="font-semibold text-gray-700">{subscription.billingCycle}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Lockers</p>
                                        <p className="font-semibold text-gray-700">{subscription.assignedLockers.length}/{subscription.features.maxLockers}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Next billing</p>
                                        <p className="font-semibold text-gray-700">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!subscriptions.length && (
                            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                                No subscriptions yet. Create one to start assigning lockers.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Locker Availability</h3>
                            <p className="text-sm text-gray-500">Monitor available capacity by location</p>
                        </div>
                        <button
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onClick={() => setActiveTab('lockers')}
                        >
                            Explore
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {locations.slice(0, 4).map((location) => (
                            <div key={location.id} className="border border-gray-100 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{location.name}</p>
                                        <p className="text-xs text-gray-500">{location.address}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-600">{location.availableLockers} free</p>
                                        <p className="text-xs text-gray-400">of {location.totalLockers} lockers</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!locations.length && (
                            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                                No locations configured yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPlans = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
                    <p className="text-gray-500">Compare available locker subscriptions and their benefits.</p>
                </div>
                <button onClick={() => setPlansMessage('Plans refreshed.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>
            {plansMessage && (
                <div className="bg-blue-50 text-blue-700 text-sm rounded-lg px-4 py-3">{plansMessage}</div>
            )}
            {plansLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                            <div className="absolute right-6 top-6">
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600">{plan.isActive ? 'Active' : 'Archived'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-500">{plan.description}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-gray-900">${plan.monthlyPrice}</p>
                                <span className="text-sm text-gray-400">/ month</span>
                            </div>
                            <p className="text-xs text-gray-400">${plan.yearlyPrice} billed yearly</p>
                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to {plan.features.maxLockers} lockers
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sizes: {plan.features.lockerSizes.join(', ')}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {plan.features.maxReservationsPerMonth < 0 ? 'Unlimited reservations' : `${plan.features.maxReservationsPerMonth} reservations / month`}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {plan.features.allowSharing ? `Share with up to ${plan.features.maxSharedUsers} users` : 'Sharing disabled'}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Advance booking window: {plan.features.advancedBooking} days
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSubscriptions = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Subscriptions</h2>
                    <p className="text-gray-500">Create, upgrade and share locker plans for your organisation.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        onClick={() => {
                            setCreateFormOpen((prev) => !prev);
                            setCreateState({ loading: false, message: null, error: null });
                            setCreateSubscriptionForm((prev) => ({
                                ...prev,
                                planId: prev.planId || plans[0]?.id || '',
                                locationId: prev.locationId || locations[0]?.id || '',
                            }));
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        New Subscription
                    </button>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <label htmlFor="userId" className="text-gray-500">User ID</label>
                        <input
                            id="userId"
                            type="number"
                            value={selectedUserId || ''}
                            onChange={(event) => {
                                const value = Number(event.target.value);
                                setSelectedUserId(Number.isNaN(value) ? 0 : value);
                                setAvailabilityForm((prev) => ({ ...prev, userId: Number.isNaN(value) ? 0 : value }));
                                setReservationForm((prev) => ({ ...prev, userId: Number.isNaN(value) ? 0 : value }));
                            }}
                            className="w-24 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="User"
                        />
                    </div>
                </div>
            </div>

            {createFormOpen && (
                <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Create Subscription</h3>
                            <p className="text-sm text-gray-500">Select a plan, location and billing cycle to provision a new locker subscription.</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600" onClick={resetCreateForm}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Plan</label>
                            <select
                                value={createSubscriptionForm.planId}
                                onChange={(event) => setCreateSubscriptionForm((prev) => ({ ...prev, planId: event.target.value }))}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>
                                    Select plan
                                </option>
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Location</label>
                            <select
                                value={createSubscriptionForm.locationId}
                                onChange={(event) => setCreateSubscriptionForm((prev) => ({ ...prev, locationId: event.target.value }))}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>
                                    Select location
                                </option>
                                {locations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Billing cycle</label>
                            <select
                                value={createSubscriptionForm.billingCycle}
                                onChange={(event) => setCreateSubscriptionForm((prev) => ({
                                    ...prev,
                                    billingCycle: event.target.value as CreateSubscriptionRequest['billingCycle'],
                                }))}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Payment method</label>
                            <input
                                type="text"
                                value={createSubscriptionForm.paymentMethodId}
                                onChange={(event) => setCreateSubscriptionForm((prev) => ({ ...prev, paymentMethodId: event.target.value }))}
                                placeholder="Payment method reference"
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="autoRenew"
                                type="checkbox"
                                checked={createSubscriptionForm.autoRenew}
                                onChange={(event) => setCreateSubscriptionForm((prev) => ({ ...prev, autoRenew: event.target.checked }))}
                                className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="autoRenew" className="text-sm text-gray-600">
                                Enable automatic renewal
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="text-sm text-gray-500">
                            Billing will start immediately using the selected payment method. You can cancel any time.
                        </div>
                        <div className="flex items-center gap-3">
                            {createState.error && <span className="text-sm text-red-600">{createState.error}</span>}
                            {createState.message && <span className="text-sm text-emerald-600">{createState.message}</span>}
                            <button
                                onClick={handleCreateSubscription}
                                disabled={createState.loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                            >
                                {createState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create subscription'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {subscriptionsLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {subscriptions.map((subscription) => {
                        const isExpanded = expandedSubscriptionId === subscription.id;
                        const usage = usageDetails[subscription.id];
                        const calendar = calendarDetails[subscription.id];
                        return (
                            <div key={subscription.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{subscription.planName}</h3>
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{subscription.status}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{subscription.locationName}</p>
                                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                                                <span>Billing: <strong>{subscription.billingCycle}</strong></span>
                                                <span>Monthly: <strong>${subscription.monthlyPrice}</strong></span>
                                                <span>Auto renew: <strong>{subscription.isAutoRenew ? 'Yes' : 'No'}</strong></span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                                                onClick={() => {
                                                    setExpandedSubscriptionId(isExpanded ? null : subscription.id);
                                                    setUpgradePlanId('');
                                                }}
                                            >
                                                {isExpanded ? 'Hide details' : 'View details'}
                                            </button>
                                            <button
                                                className="px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                                                onClick={() => {
                                                    setExpandedSubscriptionId(subscription.id);
                                                    setUpgradeState({ loading: false, message: null, error: null });
                                                }}
                                            >
                                                Upgrade
                                            </button>
                                            <button
                                                className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                                onClick={() => handleCancelSubscription(subscription.id)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 pt-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="border border-gray-100 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Assigned lockers</h4>
                                                    <div className="space-y-2">
                                                        {subscription.assignedLockers.length ? (
                                                            subscription.assignedLockers.map((locker) => (
                                                                <div key={locker.lockerId} className="flex items-center justify-between text-sm text-gray-600">
                                                                    <span>{locker.lockerNumber} · {locker.size}</span>
                                                                    <span className="text-xs text-gray-400">{locker.isAvailable ? 'Available' : 'In use'}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-400">No lockers assigned yet.</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="border border-gray-100 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Plan features</h4>
                                                    <div className="text-xs text-gray-500 space-y-1">
                                                        <p>Max lockers: <strong>{subscription.features.maxLockers}</strong></p>
                                                        <p>Sharing: <strong>{subscription.features.allowSharing ? `Up to ${subscription.features.maxSharedUsers}` : 'Disabled'}</strong></p>
                                                        <p>Current shared users: <strong>{subscription.features.currentSharedUsers || 0}</strong></p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border border-gray-100 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Upgrade plan</h4>
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                                    <select
                                                        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={upgradePlanId}
                                                        onChange={(event) => setUpgradePlanId(event.target.value)}
                                                    >
                                                        <option value="">Select new plan</option>
                                                        {plans.filter((plan) => plan.id !== subscription.planId).map((plan) => (
                                                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="flex items-center gap-3">
                                                        {upgradeState.error && <span className="text-sm text-red-600">{upgradeState.error}</span>}
                                                        {upgradeState.message && <span className="text-sm text-emerald-600">{upgradeState.message}</span>}
                                                        <button
                                                            onClick={() => handleUpgradeSubscription(subscription.id)}
                                                            disabled={upgradeState.loading}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                                        >
                                                            {upgradeState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade plan'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border border-gray-100 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Share access</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500">User ID</label>
                                                        <input
                                                            type="number"
                                                            value={sharingForm.sharedWithUserId || ''}
                                                            onChange={(event) => setSharingForm((prev) => ({
                                                                ...prev,
                                                                sharedWithUserId: event.target.value ? Number(event.target.value) : undefined,
                                                            }))}
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                            placeholder="User ID"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Email</label>
                                                        <input
                                                            type="email"
                                                            value={sharingForm.sharedWithEmail || ''}
                                                            onChange={(event) => setSharingForm((prev) => ({
                                                                ...prev,
                                                                sharedWithEmail: event.target.value || undefined,
                                                            }))}
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                            placeholder="user@example.com"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Permissions</label>
                                                        <select
                                                            multiple
                                                            value={sharingForm.permissions}
                                                            onChange={(event) => {
                                                                const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                                                                setSharingForm((prev) => ({ ...prev, permissions: selected }));
                                                            }}
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24"
                                                        >
                                                            {['VIEW', 'BOOK', 'EXTEND', 'MANAGE', 'CANCEL', 'SHARE'].map((permission) => (
                                                                <option key={permission} value={permission}>{permission}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Info className="w-4 h-4 text-blue-500" />
                                                        Invitees will receive email instructions to access lockers.
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {sharingState.error && <span className="text-sm text-red-600">{sharingState.error}</span>}
                                                        {sharingState.message && <span className="text-sm text-emerald-600">{sharingState.message}</span>}
                                                        <button
                                                            onClick={() => handleShareSubscription(subscription.id)}
                                                            disabled={sharingState.loading}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                                        >
                                                            {sharingState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send invite'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="border border-gray-100 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-semibold text-gray-800">Usage insights</h4>
                                                        <button
                                                            className="text-xs text-blue-600 hover:underline"
                                                            onClick={() => handleLoadUsage(subscription.id)}
                                                        >
                                                            Refresh
                                                        </button>
                                                    </div>
                                                    {usage ? (
                                                        <div className="text-xs text-gray-600 space-y-2">
                                                            <p>Reservations this month: <strong>{usage.reservationUsage.reservationsThisMonth}/{usage.reservationUsage.maxReservationsPerMonth}</strong></p>
                                                            <p>Utilisation rate: <strong>{usage.reservationUsage.utilizationRate}%</strong></p>
                                                            <p>Active shared users: <strong>{usage.sharingUsage.activeSharedUsers}/{usage.sharingUsage.maxSharedUsers}</strong></p>
                                                            <p>Monthly charge: <strong>${usage.financialSummary.monthlyCharge}</strong></p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400">Click refresh to load usage analytics.</p>
                                                    )}
                                                </div>
                                                <div className="border border-gray-100 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-semibold text-gray-800">Family calendar</h4>
                                                        <button
                                                            className="text-xs text-blue-600 hover:underline"
                                                            onClick={() => handleLoadCalendar(subscription.id)}
                                                        >
                                                            {calendarLoading ? 'Loading...' : 'Load week'}
                                                        </button>
                                                    </div>
                                                    {calendar ? (
                                                        <div className="space-y-2">
                                                            {(calendar.timeSlots ?? []).slice(0, 3).map((slot) => (
                                                                <div key={slot.startTime} className="text-xs text-gray-600">
                                                                    <p className="font-semibold text-gray-800">{new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}</p>
                                                                    <p className="text-gray-500">Status: {slot.status}</p>
                                                                    {(slot.reservations ?? []).map((reservation) => (
                                                                        <p key={reservation.reservationId} className="text-gray-400">• {reservation.userName} ({reservation.reservationType})</p>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400">Load the calendar to view family reservations and potential conflicts.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {!subscriptions.length && (
                        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500">
                            No active subscriptions yet. Start by creating one using the button above.
                        </div>
                    )}
                </div>
            )}

            {accessibleSubscriptions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Shared with me</h3>
                        <p className="text-sm text-gray-500">Plans you can access through sharing permissions.</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {accessibleSubscriptions.map((subscription) => (
                            <div key={subscription.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{subscription.planName} · {subscription.locationName}</p>
                                    <p className="text-xs text-gray-500">Access: {subscription.accessType}</p>
                                    <p className="text-xs text-gray-400">Permissions: {subscription.permissions.join(', ')}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Shared by {subscription.ownerName || 'Unknown'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderLockers = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Locker network</h2>
                    <p className="text-gray-500">Monitor locations, availability and allocate lockers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedLocationId}
                        onChange={(event) => {
                            setSelectedLocationId(event.target.value);
                            setAvailabilityForm((prev) => ({ ...prev, locationId: event.target.value }));
                            setReservationForm((prev) => ({ ...prev, locationId: event.target.value }));
                        }}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select location</option>
                        {locations.map((location) => (
                            <option key={location.id} value={location.id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                    <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg" onClick={() => setSelectedLocationId('')}>
                        Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Location overview</h3>
                                <p className="text-sm text-gray-500">Key metrics for the selected site.</p>
                            </div>
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        {selectedLocationId ? (
                            <div className="p-5">
                                {locations
                                    .filter((location) => location.id === selectedLocationId)
                                    .map((location) => (
                                        <div key={location.id} className="space-y-3">
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span>Total lockers: <strong>{location.totalLockers}</strong></span>
                                                <span>Available: <strong className="text-emerald-600">{location.availableLockers}</strong></span>
                                                <span>Status: <strong>{location.status}</strong></span>
                                            </div>
                                            {location.features && (
                                                <div className="text-xs text-gray-500">
                                                    <p className="font-semibold text-gray-700">Features</p>
                                                    <p>{location.features.join(' · ')}</p>
                                                </div>
                                            )}
                                            {location.operatingHours && (
                                                <div className="text-xs text-gray-500">
                                                    <p className="font-semibold text-gray-700">Operating hours</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                                        {Object.entries(location.operatingHours).map(([day, hours]) => (
                                                            <div key={day} className="bg-gray-50 rounded-lg px-3 py-2">
                                                                <p className="uppercase text-[10px] text-gray-400">{day}</p>
                                                                <p className="text-xs text-gray-600">{hours}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="p-5 text-sm text-gray-400">Select a location to view details.</div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Lockers at location</h3>
                            <span className="text-sm text-gray-400">{locationLockers.length} lockers</span>
                        </div>
                        {locationLockers.length ? (
                            <div className="divide-y divide-gray-100">
                                {locationLockers.map((locker) => (
                                    <div key={locker.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Locker {locker.lockerNumber}</p>
                                            <p className="text-xs text-gray-500">Size {locker.size} · {locker.features?.join(', ')}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', locker.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                                {locker.status}
                                            </span>
                                            {locker.nextAvailableFrom && (
                                                <span className="text-xs text-gray-400">Next available {new Date(locker.nextAvailableFrom).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-5 text-sm text-gray-400">Select a location to view lockers.</div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Check availability</h3>
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                            <input
                                type="datetime-local"
                                value={availabilityForm.requestedFrom}
                                onChange={(event) => setAvailabilityForm((prev) => ({ ...prev, requestedFrom: event.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                type="datetime-local"
                                value={availabilityForm.requestedUntil}
                                onChange={(event) => setAvailabilityForm((prev) => ({ ...prev, requestedUntil: event.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <select
                                value={availabilityForm.requiredSize}
                                onChange={(event) => setAvailabilityForm((prev) => ({
                                    ...prev,
                                    requiredSize: event.target.value as LockerAvailabilityRequest['requiredSize'],
                                }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                                {['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleCheckAvailability}
                                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                disabled={availabilityState.loading}
                            >
                                {availabilityState.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Check availability'}
                            </button>
                            {availabilityState.error && <p className="text-xs text-red-600">{availabilityState.error}</p>}
                            {availabilityResult && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 space-y-2">
                                    <p className="font-semibold text-blue-800">Availability result</p>
                                    <p>{availabilityResult.isAvailable ? 'Lockers are available for this slot.' : availabilityResult.reason}</p>
                                    <div className="space-y-1">
                                        {availabilityResult.availableLockers.map((locker) => (
                                            <p key={locker.lockerId}>• Locker {locker.lockerNumber} ({locker.size})</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Reserve locker</h3>
                        <div className="space-y-3">
                            <select
                                value={reservationForm.lockerId}
                                onChange={(event) => setReservationForm((prev) => ({ ...prev, lockerId: event.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Select locker</option>
                                {availableLockers.map((locker) => (
                                    <option key={locker.id} value={locker.id}>
                                        {locker.lockerNumber} · {locker.size}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="datetime-local"
                                value={reservationForm.reservedFrom}
                                onChange={(event) => setReservationForm((prev) => ({ ...prev, reservedFrom: event.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                type="datetime-local"
                                value={reservationForm.reservedUntil}
                                onChange={(event) => setReservationForm((prev) => ({ ...prev, reservedUntil: event.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                type="text"
                                value={reservationForm.notes || ''}
                                onChange={(event) => setReservationForm((prev) => ({ ...prev, notes: event.target.value }))}
                                placeholder="Reservation notes"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                                onClick={handleReserveLocker}
                                className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                disabled={reservationState.loading}
                            >
                                {reservationState.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create reservation'}
                            </button>
                            {reservationState.error && <p className="text-xs text-red-600">{reservationState.error}</p>}
                            {reservationState.message && <p className="text-xs text-emerald-600">{reservationState.message}</p>}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Accessible lockers</h3>
                        <div className="space-y-2">
                            {accessibleLockers.length ? (
                                accessibleLockers.slice(0, 6).map((locker) => (
                                    <div key={locker.id} className="flex items-center justify-between text-xs text-gray-600 border border-gray-100 rounded-lg px-3 py-2">
                                        <div>
                                            <p className="font-semibold text-gray-800">Locker {locker.lockerNumber}</p>
                                            <p className="text-gray-400">{locker.locationName} · {locker.size}</p>
                                        </div>
                                        <span className={cn('px-2 py-1 rounded-full font-semibold', locker.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                            {locker.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400">No accessible lockers found for this user.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReservations = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reservations</h2>
                    <p className="text-gray-500">Track active deliveries, pickups and locker usage.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={reservationStatusFilter}
                        onChange={(event) => setReservationStatusFilter(event.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">All statuses</option>
                        {['CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                    <button
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        onClick={async () => {
                            if (!selectedUserId) return;
                            const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
                            setReservations(response.data);
                        }}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="divide-y divide-gray-100">
                    {reservations.length ? (
                        reservations.map((reservation) => (
                            <div key={reservation.id} className="p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900">Locker {reservation.lockerNumber}</h3>
                                            <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', reservation.status === 'ACTIVE' || reservation.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600')}>
                                                {reservation.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{reservation.locationName}</p>
                                        <p className="text-xs text-gray-400">{new Date(reservation.reservedFrom).toLocaleString()} → {new Date(reservation.reservedUntil).toLocaleString()}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            className="px-3 py-2 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                                            onClick={() => handleExtendReservation(reservation.id)}
                                        >
                                            Extend
                                        </button>
                                        <button
                                            className="px-3 py-2 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                            onClick={() => handleCancelReservation(reservation.id)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                                {reservation.notes && (
                                    <p className="mt-3 text-xs text-gray-500">Notes: {reservation.notes}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-gray-500">
                            No reservations found. Use the lockers tab to create one.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Locker Management</h1>
                        <p className="text-gray-500">Administer subscription plans, allocate lockers and monitor reservations.</p>
                    </div>
                    <div className="text-sm text-gray-400">
                        <p>Signed in as <strong>{user?.name || 'Admin'}</strong></p>
                        <p>User context: <strong>{selectedUserId || 'Not selected'}</strong></p>
                    </div>
                </div>
                <div className="mt-6">{renderTabNavigation()}</div>
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'plans' && renderPlans()}
            {activeTab === 'subscriptions' && renderSubscriptions()}
            {activeTab === 'lockers' && renderLockers()}
            {activeTab === 'reservations' && renderReservations()}
        </div>
    );
}

export default LockerManagementDashboard;
