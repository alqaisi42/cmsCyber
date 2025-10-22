'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AccessibleSubscription,
    CreateSubscriptionRequest,
    LockerSubscription,
    LockerSubscriptionPlan,
    ShareSubscriptionRequest,
    SubscriptionUsageSnapshot,
    UpdateSharingRequest,
} from '../../../core/entities/locker-subscription';
import {
    FamilyCalendarResponse,
    LockerAvailabilityRequest,
    LockerAvailabilityResult,
    LockerLocation,
    LockerLocationWithLockers,
    LockerReservation,
    LockerReservationRequest,
    LockerSummary,
} from '../../../core/entities/lockers';
import {
    LockerIssueDigest,
    LockerSupportTask,
    LockerSupportTicket,
    LockerSupportSummary,
    LockerTaskImpact,
    LockerTaskStatus,
    LockerTicketPriority,
    LockerTicketStatus,
} from '../../../core/entities/locker-support';
import { useAuthStore } from '../../contexts/auth-store';
import { lockerSubscriptionService } from '../../../infrastructure/services/locker-subscription.service';
import { lockerManagementService } from '../../../infrastructure/services/locker-management.service';
import { lockerSupportService } from '../../../infrastructure/services/locker-support.service';
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
    LifeBuoy,
    MessageSquare,
    Users,
    X,
    Info,
    AlertTriangle,
    ClipboardList,
    MessageCircle,
} from 'lucide-react';
import { useToast } from '@/presentation/components/ui/toast';
import { cn } from '../../../shared/utils/cn';

const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'plans', label: 'Subscription Plans', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'lockers', label: 'Lockers & Availability', icon: Lock },
    { id: 'reservations', label: 'Reservations', icon: CalendarCheck },
    { id: 'support', label: 'Support & Issues', icon: LifeBuoy },
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
    paymentMethodId: '',
};

const INITIAL_SHARING_FORM: ShareSubscriptionRequest = {
    userEmail: '',
    sharingType: 'BASIC',
    allocatedBalance: 1,
    accessLevel: 'BASIC_ACCESS',
    invitationMessage: '',
};

const INITIAL_AVAILABILITY_FORM: LockerAvailabilityRequest = {
    userId: undefined,
    locationId: '',
    requiredSize: 'MEDIUM',
    requestedFrom: '',
    requestedUntil: '',
    reservationType: 'DELIVERY',
    userScope: 'SPECIFIC_USER',
};

const INITIAL_RESERVATION_FORM: LockerReservationRequest = {
    userId: undefined,
    lockerId: '',
    locationId: '',
    reservedFrom: '',
    reservedUntil: '',
    reservationType: 'DELIVERY',
    notes: '',
    userScope: 'SPECIFIC_USER',
};

export function LockerManagementDashboard({ defaultTab = 'overview' }: LockerManagementDashboardProps) {
    const { user, token } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
    const { pushToast } = useToast();

    const [plans, setPlans] = useState<LockerSubscriptionPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansMessage, setPlansMessage] = useState<string | null>(null);
    const [activePlans, setActivePlans] = useState<LockerSubscription[]>([]);
    const [activePlansLoading, setActivePlansLoading] = useState(false);
    const [activePlansError, setActivePlansError] = useState<string | null>(null);

    const [subscriptions, setSubscriptions] = useState<LockerSubscription[]>([]);
    const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
    const [accessibleSubscriptions, setAccessibleSubscriptions] = useState<AccessibleSubscription[]>([]);

    const [locations, setLocations] = useState<LockerLocation[]>([]);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [locationHierarchy, setLocationHierarchy] = useState<LockerLocationWithLockers[]>([]);
    const [locationHierarchyLoading, setLocationHierarchyLoading] = useState(false);
    const [locationHierarchyError, setLocationHierarchyError] = useState<string | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [locationLockers, setLocationLockers] = useState<LockerSummary[]>([]);
    const [accessibleLockers, setAccessibleLockers] = useState<LockerSummary[]>([]);
    const [availableLockers, setAvailableLockers] = useState<LockerSummary[]>([]);

    const [reservations, setReservations] = useState<LockerReservation[]>([]);
    const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('ACTIVE');

    const [availabilityForm, setAvailabilityForm] = useState<LockerAvailabilityRequest>(INITIAL_AVAILABILITY_FORM);
    const [availabilityResult, setAvailabilityResult] = useState<LockerAvailabilityResult | null>(null);
    const [availabilityState, setAvailabilityState] = useState<ActionState>({ loading: false, message: null, error: null });
    const [availabilityScope, setAvailabilityScope] = useState<'SPECIFIC_USER' | 'ALL_USERS'>(
        INITIAL_AVAILABILITY_FORM.userScope || 'SPECIFIC_USER'
    );

    const [reservationForm, setReservationForm] = useState<LockerReservationRequest>(INITIAL_RESERVATION_FORM);
    const [reservationState, setReservationState] = useState<ActionState>({ loading: false, message: null, error: null });
    const [reservationScope, setReservationScope] = useState<'SPECIFIC_USER' | 'ALL_USERS'>(
        INITIAL_RESERVATION_FORM.userScope || 'SPECIFIC_USER'
    );

    const [createSubscriptionForm, setCreateSubscriptionForm] = useState<CreateSubscriptionRequest>(INITIAL_SUBSCRIPTION_FORM);
    const [createFormOpen, setCreateFormOpen] = useState(false);
    const [createState, setCreateState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [upgradePlanId, setUpgradePlanId] = useState<string>('');
    const [upgradeReason, setUpgradeReason] = useState<string>('');
    const [upgradeState, setUpgradeState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [sharingForm, setSharingForm] = useState<ShareSubscriptionRequest>(INITIAL_SHARING_FORM);
    const [sharingState, setSharingState] = useState<ActionState>({ loading: false, message: null, error: null });

    const [selectedUserId, setSelectedUserId] = useState<number>(() => {
        if (user?.id) {
            const numeric = Number(user.id);
            return Number.isNaN(numeric) ? 0 : numeric;
        }
        return 0;
    });

    const [usageDetails, setUsageDetails] = useState<Record<string, SubscriptionUsageSnapshot>>({});
    const [calendarDetails, setCalendarDetails] = useState<Record<string, FamilyCalendarResponse>>({});
    const [calendarLoading, setCalendarLoading] = useState(false);

    const [supportSummary, setSupportSummary] = useState<LockerSupportSummary | null>(null);
    const [supportTickets, setSupportTickets] = useState<LockerSupportTicket[]>([]);
    const [supportTasks, setSupportTasks] = useState<LockerSupportTask[]>([]);
    const [supportIssues, setSupportIssues] = useState<LockerIssueDigest[]>([]);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState<string | null>(null);
    const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | LockerTicketStatus>('ALL');
    const [ticketPriorityFilter, setTicketPriorityFilter] = useState<'ALL' | LockerTicketPriority>('ALL');
    const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'COMPLETED'>('ALL');
    const [newTaskForm, setNewTaskForm] = useState<{
        title: string;
        owner: string;
        dueDate: string;
        impact: LockerTaskImpact;
        relatedTicketId: string;
    }>({
        title: '',
        owner: '',
        dueDate: '',
        impact: 'MEDIUM',
        relatedTicketId: '',
    });

    const ticketStatuses: LockerTicketStatus[] = [
        'NEW',
        'ACKNOWLEDGED',
        'IN_PROGRESS',
        'WAITING_ON_CUSTOMER',
        'WAITING_ON_PROVIDER',
        'RESOLVED',
        'CLOSED',
    ];
    const ticketPriorities: LockerTicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const taskStatuses: LockerTaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
    const taskImpacts: LockerTaskImpact[] = ['LOW', 'MEDIUM', 'HIGH'];
    const supportOwners = [
        'Unassigned',
        'Omar Khalil',
        'Sara Haddad',
        'Nour Al-Fayez',
        'Field Ops',
        'Maintenance Queue',
        'Support Triage',
    ];

    const loadSupportOverview = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!token) {
                return false;
            }
            if (!silent) {
                setSupportLoading(true);
            }
            setSupportError(null);
            try {
                const response = await lockerSupportService.getSupportOverview(token);
                setSupportSummary(response.data.summary);
                setSupportTickets(response.data.tickets);
                setSupportTasks(response.data.tasks);
                setSupportIssues(response.data.issueDigest);
                if (response.errors?.includes('FALLBACK_DATA')) {
                    pushToast({
                        type: 'warning',
                        title: 'Support insights limited',
                        description:
                            response.message ||
                            'Showing cached locker support data until live services are available.',
                    });
                } else if (response.errors?.length) {
                    pushToast({
                        type: 'info',
                        title: 'Support overview returned warnings',
                        description:
                            response.message || 'Locker support API responded with advisory messages.',
                    });
                }
                return true;
            } catch (error) {
                const description =
                    error instanceof Error ? error.message : 'Unexpected error loading support overview.';
                setSupportError(description);
                pushToast({
                    type: 'error',
                    title: 'Unable to load locker support',
                    description,
                });
                return false;
            } finally {
                setSupportLoading(false);
            }
        },
        [token, pushToast]
    );

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        if (availabilityScope === 'SPECIFIC_USER') {
            setAvailabilityForm((prev) => ({
                ...prev,
                userId: selectedUserId || undefined,
                userScope: 'SPECIFIC_USER',
            }));
        }
        if (reservationScope === 'SPECIFIC_USER') {
            setReservationForm((prev) => ({
                ...prev,
                userId: selectedUserId || undefined,
                userScope: 'SPECIFIC_USER',
            }));
        }
    }, [selectedUserId, availabilityScope, reservationScope]);

    useEffect(() => {
        setAvailabilityForm((prev) => ({ ...prev, locationId: selectedLocationId }));
        setReservationForm((prev) => ({ ...prev, locationId: selectedLocationId }));
    }, [selectedLocationId]);

    useEffect(() => {
        const loadPlans = async () => {
            setPlansLoading(true);
            try {
                const response = await lockerSubscriptionService.getPlans();
                setPlans(response.data);
                setPlansMessage(response.message || null);
                if (response.errors?.includes('FALLBACK_DATA')) {
                    pushToast({
                        type: 'warning',
                        title: 'Showing fallback plans',
                        description: response.message || 'Using cached locker plans while the API is unreachable.',
                    });
                }
            } catch (error) {
                console.error('Failed to load plans:', error);
                setPlansMessage('Unable to load subscription plans.');
                pushToast({
                    type: 'error',
                    title: 'Failed to load plans',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving plans.',
                });
            } finally {
                setPlansLoading(false);
            }
        };

        const loadLocations = async () => {
            setLocationsLoading(true);
            try {
                const response = await lockerManagementService.getLocations(token);
                setLocations(response.data);
                if (response.data.length) {
                    setSelectedLocationId((prev) => prev || response.data[0].id);
                }
                if (response.errors?.includes('FALLBACK_DATA')) {
                    pushToast({
                        type: 'warning',
                        title: 'Locations are cached',
                        description: response.message ||
                            'Showing cached locker locations while the admin API is unreachable.',
                    });
                }
            } catch (error) {
                console.error('Failed to load locations:', error);
                pushToast({
                    type: 'error',
                    title: 'Failed to load locations',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving locker locations.',
                });
            } finally {
                setLocationsLoading(false);
            }
        };

        const loadLocationHierarchy = async () => {
            setLocationHierarchyLoading(true);
            setLocationHierarchyError(null);
            try {
                const response = await lockerManagementService.getLocationsHierarchy(token);
                setLocationHierarchy(response.data);
                if (response.errors?.includes('FALLBACK_DATA')) {
                    pushToast({
                        type: 'warning',
                        title: 'Limited location data',
                        description: response.message ||
                            'Showing cached location structure while the admin API is unavailable.',
                    });
                } else if (response.errors?.includes('FALLBACK_AVAILABLE_ONLY')) {
                    pushToast({
                        type: 'warning',
                        title: 'Partial locker data',
                        description:
                            response.message ||
                            'Only currently available lockers could be retrieved for one or more locations.',
                    });
                }
            } catch (error) {
                console.error('Failed to load location hierarchy:', error);
                const description = error instanceof Error ? error.message : 'Unexpected error retrieving location hierarchy.';
                setLocationHierarchyError(description);
                pushToast({
                    type: 'error',
                    title: 'Failed to load location hierarchy',
                    description,
                });
            } finally {
                setLocationHierarchyLoading(false);
            }
        };

        loadPlans();
        loadLocations();
        loadLocationHierarchy();
    }, [pushToast, token]);

    useEffect(() => {
        if (!token) {
            setSupportSummary(null);
            setSupportTickets([]);
            setSupportTasks([]);
            setSupportIssues([]);
            return;
        }

        loadSupportOverview();
    }, [token, loadSupportOverview]);

    useEffect(() => {
        if (!token || !selectedUserId) {
            setActivePlans([]);
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
                pushToast({
                    type: 'error',
                    title: 'Unable to load subscriptions',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving subscription data.',
                });
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
                pushToast({
                    type: 'error',
                    title: 'Unable to load accessible lockers',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving accessible lockers.',
                });
            }
        };

        const loadReservations = async () => {
            try {
                const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
                setReservations(response.data);
            } catch (error) {
                console.error('Failed to load reservations:', error);
                pushToast({
                    type: 'error',
                    title: 'Unable to load reservations',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving reservation data.',
                });
            }
        };

        loadSubscriptions();
        loadAccessibleLockers();
        loadReservations();
    }, [token, selectedUserId, reservationStatusFilter, pushToast]);

    useEffect(() => {
        if (!token || !selectedUserId) {
            setActivePlans([]);
            setActivePlansError(null);
            return;
        }

        let cancelled = false;

        const loadActivePlans = async () => {
            setActivePlansLoading(true);
            setActivePlansError(null);
            try {
                const response = await lockerManagementService.getActiveSubscriptionsForUser(selectedUserId, token);
                if (!cancelled) {
                    setActivePlans(response.data);
                    if (response.errors?.length) {
                        pushToast({
                            type: 'warning',
                            title: 'Active plans response',
                            description: response.message || 'Active plan data returned with warnings.',
                        });
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    const description = error instanceof Error ? error.message : 'Unexpected error loading active plans.';
                    setActivePlansError(description);
                    pushToast({
                        type: 'error',
                        title: 'Failed to load active plans',
                        description,
                    });
                }
            } finally {
                if (!cancelled) {
                    setActivePlansLoading(false);
                }
            }
        };

        loadActivePlans();

        return () => {
            cancelled = true;
        };
    }, [token, selectedUserId, pushToast]);

    useEffect(() => {
        if (!selectedLocationId) {
            setLocationLockers([]);
            setAvailableLockers([]);
            return;
        }

        const loadLocationLockers = async () => {
            try {
                const response = await lockerManagementService.getLockersByLocation(selectedLocationId, token);
                setLocationLockers(response.data);
            } catch (error) {
                console.error('Failed to load lockers for location:', error);
                pushToast({
                    type: 'error',
                    title: 'Unable to load lockers for location',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving lockers for location.',
                });
            }
        };

        const loadAvailable = async () => {
            const specificUserFallback = selectedUserId ?? availabilityForm.userId ?? reservationForm.userId ?? null;
            const requiresSpecificUser = availabilityScope === 'SPECIFIC_USER' || reservationScope === 'SPECIFIC_USER';
            const userContext = requiresSpecificUser ? specificUserFallback : null;

            if (
                requiresSpecificUser &&
                (typeof userContext !== 'number' || Number.isNaN(userContext) || userContext <= 0)
            ) {
                setAvailableLockers([]);
                return;
            }

            const desiredStart = availabilityForm.requestedFrom || reservationForm.reservedFrom || '';
            const desiredEnd = availabilityForm.requestedUntil || reservationForm.reservedUntil || '';
            try {
                const response = await lockerManagementService.getAvailableLockersForUser(
                    userContext,
                    selectedLocationId,
                    token,
                    {
                        size: availabilityForm.requiredSize,
                        startTime: desiredStart || undefined,
                        endTime: desiredEnd || undefined,
                        scope: requiresSpecificUser ? 'SPECIFIC_USER' : 'ALL_USERS',
                    }
                );
                setAvailableLockers(response.data);
            } catch (error) {
                console.error('Failed to load available lockers for user:', error);
                pushToast({
                    type: 'error',
                    title: 'Unable to load available lockers',
                    description: error instanceof Error ? error.message : 'Unexpected error retrieving available lockers.',
                });
            }
        };

        loadLocationLockers();
        loadAvailable();
    }, [
        selectedLocationId,
        selectedUserId,
        token,
        pushToast,
        availabilityScope,
        reservationScope,
        availabilityForm.userId,
        reservationForm.userId,
        availabilityForm.requiredSize,
        availabilityForm.requestedFrom,
        availabilityForm.requestedUntil,
        reservationForm.reservedFrom,
        reservationForm.reservedUntil,
    ]);

    const summaryMetrics = useMemo(() => {
        const activeSubscriptions = activePlans.length || subscriptions.filter((sub) => sub.subscriptionStatus === 'ACTIVE').length;
        const sharedSubscriptions = accessibleSubscriptions.filter((sub) => sub.ownerUserId !== selectedUserId).length;
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
    }, [subscriptions, accessibleSubscriptions, reservations, locations, selectedUserId]);

    const filteredTickets = useMemo(() => {
        return supportTickets.filter((ticket) => {
            const matchesStatus = ticketStatusFilter === 'ALL' || ticket.status === ticketStatusFilter;
            const matchesPriority = ticketPriorityFilter === 'ALL' || ticket.priority === ticketPriorityFilter;
            return matchesStatus && matchesPriority;
        });
    }, [supportTickets, ticketStatusFilter, ticketPriorityFilter]);

    const filteredTasks = useMemo(() => {
        if (!supportTasks.length) {
            return supportTasks;
        }
        const now = new Date();
        return supportTasks.filter((task) => {
            if (taskFilter === 'ALL') {
                return true;
            }
            if (taskFilter === 'COMPLETED') {
                return task.status === 'COMPLETED';
            }
            const dueDate = new Date(task.dueDate);
            if (Number.isNaN(dueDate.getTime())) {
                return true;
            }
            if (taskFilter === 'TODAY') {
                return task.status !== 'COMPLETED' && dueDate.toDateString() === now.toDateString();
            }
            if (taskFilter === 'OVERDUE') {
                return task.status !== 'COMPLETED' && dueDate < now;
            }
            return true;
        });
    }, [supportTasks, taskFilter]);

    const taskProgress = useMemo(() => {
        if (!supportTasks.length) {
            return 0;
        }
        const completed = supportTasks.filter((task) => task.status === 'COMPLETED').length;
        return Math.round((completed / supportTasks.length) * 100);
    }, [supportTasks]);

    const nextActionTicket = useMemo(() => {
        const ticketsWithDueDate = supportTickets.filter((ticket) => Boolean(ticket.nextActionDueAt));
        if (!ticketsWithDueDate.length) {
            return undefined;
        }
        return [...ticketsWithDueDate].sort((a, b) => {
            const dueA = new Date(a.nextActionDueAt ?? '').getTime();
            const dueB = new Date(b.nextActionDueAt ?? '').getTime();
            return dueA - dueB;
        })[0];
    }, [supportTickets]);

    const resetCreateForm = () => {
        setCreateSubscriptionForm({
            ...INITIAL_SUBSCRIPTION_FORM,
            planId: plans[0]?.id || '',
            locationId: locations[0]?.id || '',
        });
        setCreateFormOpen(false);
    };

    const handleCreateSubscription = async () => {
        if (!token) {
            const description = 'Authentication token required to create subscriptions.';
            setCreateState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Not authenticated', description });
            return;
        }

        if (!createSubscriptionForm.planId || !createSubscriptionForm.locationId || !createSubscriptionForm.paymentMethodId) {
            const description = 'Select a plan, location, and payment method before creating a subscription.';
            setCreateState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Missing information', description });
            return;
        }

        setCreateState({ loading: true, message: null, error: null });
        try {
            const creationResult = await lockerSubscriptionService.createSubscription(createSubscriptionForm, token);
            setCreateState({ loading: false, message: creationResult.message || 'Subscription created successfully.', error: null });
            const mySubscriptions = await lockerSubscriptionService.getMySubscriptions(token);
            setSubscriptions(mySubscriptions.data);
            resetCreateForm();
            pushToast({
                type: 'success',
                title: 'Subscription created',
                description: 'Your locker subscription is now active.',
            });
        } catch (error) {
            const description = error instanceof Error ? error.message : 'Failed to create subscription.';
            setCreateState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Unable to create subscription', description });
        }
    };

    const handleUpgradeSubscription = async (subscriptionId: string) => {
        if (!token) {
            const description = 'Authentication token required to upgrade subscriptions.';
            setUpgradeState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Not authenticated', description });
            return;
        }
        if (!upgradePlanId) {
            const description = 'Select the new plan to upgrade to.';
            setUpgradeState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Select a plan', description });
            return;
        }
        if (!upgradeReason.trim()) {
            const description = 'Provide a reason for the upgrade so billing can be audited.';
            setUpgradeState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Upgrade reason required', description });
            return;
        }
        setUpgradeState({ loading: true, message: null, error: null });
        try {
            const upgradeResult = await lockerSubscriptionService.upgradeSubscription(
                subscriptionId,
                { newPlanId: upgradePlanId, upgradeReason: upgradeReason.trim() },
                token
            );
            setUpgradeState({ loading: false, message: upgradeResult.message || 'Subscription upgraded successfully.', error: null });
            const mySubscriptions = await lockerSubscriptionService.getMySubscriptions(token);
            setSubscriptions(mySubscriptions.data);
            setUpgradePlanId('');
            setUpgradeReason('');
            pushToast({
                type: 'success',
                title: 'Subscription upgraded',
                description: upgradeResult.message || 'Plan upgraded successfully.',
            });
        } catch (error) {
            const description = error instanceof Error ? error.message : 'Failed to upgrade subscription.';
            setUpgradeState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Unable to upgrade subscription', description });
        }
    };

    const handleCancelSubscription = async (subscriptionId: string) => {
        if (!token) {
            pushToast({
                type: 'error',
                title: 'Not authenticated',
                description: 'Authentication token required to cancel subscriptions.',
            });
            return;
        }
        const reason = prompt('Please provide a cancellation reason');
        if (!reason || !reason.trim()) {
            pushToast({
                type: 'warning',
                title: 'Cancellation aborted',
                description: 'A cancellation reason is required to proceed.',
            });
            return;
        }

        try {
            const cancelResult = await lockerSubscriptionService.cancelSubscription(subscriptionId, reason.trim(), token);
            const mySubscriptions = await lockerSubscriptionService.getMySubscriptions(token);
            setSubscriptions(mySubscriptions.data);
            pushToast({
                type: 'success',
                title: 'Subscription cancelled',
                description: cancelResult.message || 'Subscription canceled successfully.',
            });
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Unable to cancel subscription',
                description: error instanceof Error ? error.message : 'Failed to cancel subscription.',
            });
        }
    };

    const handleShareSubscription = async (subscriptionId: string) => {
        if (!token) {
            const description = 'Authentication token required to share subscriptions.';
            setSharingState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Not authenticated', description });
            return;
        }
        if (!sharingForm.userEmail.trim()) {
            const description = 'Enter the email address of the person you want to invite.';
            setSharingState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Email required', description });
            return;
        }

        if (
            sharingForm.sharingType === 'BASIC' &&
            (!sharingForm.allocatedBalance || sharingForm.allocatedBalance <= 0)
        ) {
            const description = 'Allocated balance must be greater than 0 for BASIC sharing.';
            setSharingState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Adjust allocated balance', description });
            return;
        }

        const payload: ShareSubscriptionRequest = {
            ...sharingForm,
            allocatedBalance:
                sharingForm.sharingType === 'OWNER' ? null : sharingForm.allocatedBalance,
            invitationMessage: sharingForm.invitationMessage?.trim() || undefined,
            userEmail: sharingForm.userEmail.trim(),
        };

        if (payload.sharingType === 'OWNER') {
            payload.allocatedBalance = null;
        }

        if (payload.sharingType === 'BASIC' && !payload.allocatedBalance) {
            payload.allocatedBalance = 1;
        }

        if (payload.sharingType === 'OWNER' && payload.accessLevel === 'BASIC_ACCESS') {
            payload.accessLevel = 'FULL_ACCESS';
        }

        if (payload.sharingType === 'BASIC' && payload.accessLevel === 'FULL_ACCESS') {
            const description = 'Basic sharing cannot grant full access. Choose Basic access level or switch to Owner sharing.';
            setSharingState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Invalid access level', description });
            return;
        }

        setSharingState({ loading: true, message: null, error: null });
        try {
            const shareResult = await lockerSubscriptionService.shareSubscription(subscriptionId, payload, token);
            setSharingState({ loading: false, message: shareResult.message || 'Invitation sent successfully.', error: null });
            setSharingForm(INITIAL_SHARING_FORM);
            pushToast({
                type: 'success',
                title: 'Invitation sent',
                description: shareResult.message || 'The user will receive an email with next steps.',
            });
        } catch (error) {
            const description = error instanceof Error ? error.message : 'Failed to share subscription.';
            setSharingState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Unable to share subscription', description });
        }
    };

    const handleCheckAvailability = async () => {
        const requiresUser = availabilityScope === 'SPECIFIC_USER';
        if (
            !availabilityForm.locationId ||
            !availabilityForm.requestedFrom ||
            !availabilityForm.requestedUntil ||
            (requiresUser && !availabilityForm.userId)
        ) {
            const description = 'Complete all fields to check availability.';
            setAvailabilityState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Missing information', description });
            return;
        }
        setAvailabilityState({ loading: true, message: null, error: null });
        try {
            const payload: LockerAvailabilityRequest = {
                ...availabilityForm,
                userScope: availabilityScope,
                userId: requiresUser ? availabilityForm.userId : undefined,
            };
            const availabilityResponse = await lockerManagementService.checkLockerAvailability(payload, token);
            setAvailabilityResult(availabilityResponse.data);
            setAvailabilityState({ loading: false, message: availabilityResponse.message, error: null });
            pushToast({
                type: availabilityResponse.data.isAvailable ? 'success' : 'info',
                title: availabilityResponse.data.isAvailable ? 'Lockers available' : 'Lockers unavailable',
                description: availabilityResponse.message ||
                    (availabilityResponse.data.isAvailable
                        ? 'A locker is available for the requested time range.'
                        : availabilityResponse.data.reason || 'No lockers available for that slot.'),
            });
        } catch (error) {
            setAvailabilityResult(null);
            const description = error instanceof Error ? error.message : 'Failed to check availability.';
            setAvailabilityState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Unable to check availability', description });
        }
    };

    const handleReserveLocker = async () => {
        const requiresUser = reservationScope === 'SPECIFIC_USER';
        if (
            !reservationForm.lockerId ||
            !reservationForm.locationId ||
            !reservationForm.reservedFrom ||
            !reservationForm.reservedUntil ||
            (requiresUser && !reservationForm.userId)
        ) {
            const description = 'Complete all required fields to reserve a locker.';
            setReservationState({ loading: false, message: null, error: description });
            pushToast({ type: 'warning', title: 'Missing information', description });
            return;
        }
        setReservationState({ loading: true, message: null, error: null });
        try {
            const payload: LockerReservationRequest = {
                ...reservationForm,
                userScope: reservationScope,
                userId: requiresUser ? reservationForm.userId : undefined,
            };
            const reservationResponse = await lockerManagementService.reserveLocker(payload, token);
            setReservationState({ loading: false, message: reservationResponse.message || 'Locker reserved successfully.', error: null });
            if (selectedUserId) {
                const reservationsResponse = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
                setReservations(reservationsResponse.data);
            }
            pushToast({
                type: 'success',
                title: 'Locker reserved',
                description: reservationResponse.message || 'Reservation confirmed successfully.',
            });
        } catch (error) {
            const description = error instanceof Error ? error.message : 'Failed to reserve locker.';
            setReservationState({ loading: false, message: null, error: description });
            pushToast({ type: 'error', title: 'Unable to reserve locker', description });
        }
    };

    const handleExtendReservation = async (reservationId: string) => {
        if (!selectedUserId) return;
        const newEndTime = prompt('New end time (ISO format, e.g. 2025-10-22T16:00:00)');
        if (!newEndTime) {
            pushToast({
                type: 'warning',
                title: 'Extension cancelled',
                description: 'Reservation extension aborted because no end time was provided.',
            });
            return;
        }
        try {
            await lockerManagementService.extendReservation(reservationId, selectedUserId, newEndTime, token);
            const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
            setReservations(response.data);
            pushToast({
                type: 'success',
                title: 'Reservation extended',
                description: 'Reservation end time updated successfully.',
            });
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Unable to extend reservation',
                description: error instanceof Error ? error.message : 'Failed to extend reservation.',
            });
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        if (!selectedUserId) return;
        try {
            await lockerManagementService.cancelReservation(reservationId, selectedUserId, token);
            const response = await lockerManagementService.getReservationsForUser(selectedUserId, reservationStatusFilter, token);
            setReservations(response.data);
            pushToast({
                type: 'success',
                title: 'Reservation cancelled',
                description: 'Locker reservation cancelled successfully.',
            });
        } catch (error) {
            pushToast({
                type: 'error',
                title: 'Unable to cancel reservation',
                description: error instanceof Error ? error.message : 'Failed to cancel reservation.',
            });
        }
    };

    const handleRefreshSupport = async () => {
        const success = await loadSupportOverview({ silent: false });
        if (success) {
            pushToast({
                type: 'success',
                title: 'Support data refreshed',
                description: 'Latest support tickets, tasks and issues have been loaded.',
            });
        }
    };

    const handleTicketStatusChange = async (ticketId: string, status: LockerTicketStatus) => {
        const previousTickets = supportTickets;
        setSupportTickets((current) =>
            current.map((ticket) =>
                ticket.id === ticketId ? { ...ticket, status, updatedAt: new Date().toISOString() } : ticket
            )
        );
        try {
            const response = await lockerSupportService.updateTicketStatus(ticketId, { status }, token);
            if (response.errors?.includes('FALLBACK_ACTION')) {
                pushToast({
                    type: 'warning',
                    title: 'Ticket status saved locally',
                    description: response.message || 'Change will sync when the locker support API is reachable.',
                });
            } else {
                pushToast({
                    type: 'success',
                    title: 'Ticket updated',
                    description: response.message || 'Locker support ticket status updated successfully.',
                });
            }
        } catch (error) {
            setSupportTickets(previousTickets);
            const description = error instanceof Error ? error.message : 'Unable to update ticket status.';
            pushToast({ type: 'error', title: 'Ticket update failed', description });
        }
    };

    const handleTicketAssignment = async (ticketId: string, assignee: string) => {
        const previousTickets = supportTickets;
        const normalizedAssignee = assignee || undefined;
        setSupportTickets((current) =>
            current.map((ticket) => (ticket.id === ticketId ? { ...ticket, assignedTo: normalizedAssignee } : ticket))
        );
        try {
            const response = await lockerSupportService.assignTicket(ticketId, { assignee: assignee || 'Unassigned' }, token);
            if (response.errors?.includes('FALLBACK_ACTION')) {
                pushToast({
                    type: 'warning',
                    title: 'Assignment pending sync',
                    description: response.message || 'We will retry assignment when the support API is available.',
                });
            } else {
                pushToast({
                    type: 'success',
                    title: 'Ticket assigned',
                    description: response.message || 'Ticket ownership updated successfully.',
                });
            }
        } catch (error) {
            setSupportTickets(previousTickets);
            const description = error instanceof Error ? error.message : 'Unable to assign ticket.';
            pushToast({ type: 'error', title: 'Ticket assignment failed', description });
        }
    };

    const handleCreateSupportTask = async () => {
        if (!newTaskForm.title.trim() || !newTaskForm.owner.trim() || !newTaskForm.dueDate) {
            pushToast({
                type: 'warning',
                title: 'Add required task info',
                description: 'Title, owner and due date are required to create a follow-up task.',
            });
            return;
        }
        try {
            const response = await lockerSupportService.createTask(
                {
                    title: newTaskForm.title.trim(),
                    owner: newTaskForm.owner.trim(),
                    dueDate: newTaskForm.dueDate,
                    impact: newTaskForm.impact,
                    relatedTicketId: newTaskForm.relatedTicketId || undefined,
                },
                token
            );
            setSupportTasks((prev) => [...prev, response.data]);
            setNewTaskForm({ title: '', owner: '', dueDate: '', impact: 'MEDIUM', relatedTicketId: '' });
            if (response.errors?.includes('FALLBACK_ACTION')) {
                pushToast({
                    type: 'warning',
                    title: 'Task stored offline',
                    description: response.message || 'Task will sync to the support API when connectivity is restored.',
                });
            } else {
                pushToast({
                    type: 'success',
                    title: 'Task created',
                    description: response.message || 'Follow-up task scheduled successfully.',
                });
            }
        } catch (error) {
            const description = error instanceof Error ? error.message : 'Unable to create support task.';
            pushToast({ type: 'error', title: 'Task creation failed', description });
        }
    };

    const handleTaskStatusChange = async (taskId: string, status: LockerTaskStatus) => {
        const previousTasks = supportTasks;
        setSupportTasks((current) =>
            current.map((task) => (task.id === taskId ? { ...task, status } : task))
        );
        try {
            const response = await lockerSupportService.updateTask(taskId, { status }, token);
            if (response.errors?.includes('FALLBACK_ACTION')) {
                pushToast({
                    type: 'warning',
                    title: 'Task update queued',
                    description: response.message || 'Task change saved locally until the API is reachable.',
                });
            } else {
                pushToast({
                    type: 'success',
                    title: 'Task updated',
                    description: response.message || 'Support task updated successfully.',
                });
            }
        } catch (error) {
            setSupportTasks(previousTasks);
            const description = error instanceof Error ? error.message : 'Unable to update task.';
            pushToast({ type: 'error', title: 'Task update failed', description });
        }
    };

    const handleSnoozeTask = async (taskId: string, days = 1) => {
        const task = supportTasks.find((item) => item.id === taskId);
        if (!task) {
            return;
        }
        const updatedDueDate = new Date(task.dueDate || new Date().toISOString());
        updatedDueDate.setDate(updatedDueDate.getDate() + days);
        const previousTasks = supportTasks;
        setSupportTasks((current) =>
            current.map((item) =>
                item.id === taskId ? { ...item, dueDate: updatedDueDate.toISOString(), status: 'IN_PROGRESS' } : item
            )
        );
        try {
            const response = await lockerSupportService.updateTask(taskId, {
                dueDate: updatedDueDate.toISOString(),
                status: 'IN_PROGRESS',
            });
            if (response.errors?.includes('FALLBACK_ACTION')) {
                pushToast({
                    type: 'warning',
                    title: 'Task snooze pending sync',
                    description: response.message || 'New due date will sync once the API becomes available.',
                });
            } else {
                pushToast({
                    type: 'success',
                    title: 'Task rescheduled',
                    description: response.message || 'Due date extended successfully.',
                });
            }
        } catch (error) {
            setSupportTasks(previousTasks);
            const description = error instanceof Error ? error.message : 'Unable to reschedule task.';
            pushToast({ type: 'error', title: 'Task reschedule failed', description });
        }
    };

    const handleLoadUsage = async (subscriptionId: string) => {
        if (usageDetails[subscriptionId] || !token) return;
        try {
            const response = await lockerSubscriptionService.getUsage(subscriptionId, token);
            setUsageDetails((prev) => ({ ...prev, [subscriptionId]: response.data }));
        } catch (error) {
            console.error('Failed to load usage stats:', error);
            pushToast({
                type: 'error',
                title: 'Unable to load usage stats',
                description: error instanceof Error ? error.message : 'Failed to load subscription usage.',
            });
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
            pushToast({
                type: 'error',
                title: 'Unable to load reservation calendar',
                description: error instanceof Error ? error.message : 'Failed to load locker reservation calendar.',
            });
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

    const renderSupport = () => {
        const metrics = [
            {
                label: 'Open tickets',
                value: supportSummary?.openTickets ?? 0,
                description: 'Active locker issues under triage',
                icon: LifeBuoy,
                accent: 'bg-rose-50 text-rose-600',
            },
            {
                label: 'SLA breaches',
                value: supportSummary?.breachedTickets ?? 0,
                description: 'Tickets outside agreed response windows',
                icon: AlertTriangle,
                accent: 'bg-amber-50 text-amber-600',
            },
            {
                label: 'Avg. first response',
                value: `${supportSummary ? supportSummary.avgFirstResponseMinutes : 0}m`,
                description: 'Minutes to acknowledge new tickets',
                icon: MessageCircle,
                accent: 'bg-blue-50 text-blue-600',
            },
            {
                label: 'Resolution velocity',
                value: `${supportSummary ? supportSummary.avgResolutionHours : 0}h`,
                description: 'Median resolution time across incidents',
                icon: Clock,
                accent: 'bg-emerald-50 text-emerald-600',
            },
        ];

        const issueTrendLegend: Record<LockerIssueDigest['trend'], string> = {
            UP: 'text-rose-600',
            STABLE: 'text-amber-600',
            DOWN: 'text-emerald-600',
        };

        return (
            <div className="space-y-6">
                <div id="locker-support-playbook" className="sr-only" aria-hidden="true"></div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wide">
                                <LifeBuoy className="w-4 h-4" />
                                Locker Care Desk
                            </div>
                            <h2 className="mt-2 text-2xl font-bold text-gray-900">Support &amp; Incident Response</h2>
                            <p className="text-gray-500">
                                Monitor escalations, coach agents, and coordinate field teams across locker locations in real time.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleRefreshSupport}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                                disabled={supportLoading}
                            >
                                {supportLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Refresh
                            </button>
                            <a
                                href="#locker-support-playbook"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                View playbook
                            </a>
                        </div>
                    </div>
                    {supportError && (
                        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Support data might be stale</p>
                                <p className="mt-1 text-amber-600">{supportError}</p>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {metrics.map((metric) => {
                            const MetricIcon = metric.icon;
                            return (
                                <div key={metric.label} className="rounded-xl border border-gray-100 bg-gray-50 p-5 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                {metric.label}
                                            </p>
                                            <p className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</p>
                                            <p className="mt-2 text-xs text-gray-500">{metric.description}</p>
                                        </div>
                                        <span className={cn('rounded-full p-3', metric.accent)}>
                                            <MetricIcon className="h-5 w-5" />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Live incident queue</h3>
                                    <p className="text-sm text-gray-500">
                                        Prioritise escalations, acknowledge blockers, and align stakeholders before SLAs slip.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={ticketStatusFilter}
                                        onChange={(event) =>
                                            setTicketStatusFilter(event.target.value as typeof ticketStatusFilter)
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All statuses</option>
                                        {ticketStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status.replaceAll('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={ticketPriorityFilter}
                                        onChange={(event) =>
                                            setTicketPriorityFilter(event.target.value as typeof ticketPriorityFilter)
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All priorities</option>
                                        {ticketPriorities.map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                {supportLoading && (
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-blue-200 bg-blue-50 p-6 text-sm text-blue-600">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing support feed...
                                    </div>
                                )}
                                {!supportLoading && filteredTickets.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                                        No tickets match the current filters. Adjust filters or refresh to load new incidents.
                                    </div>
                                )}
                                {filteredTickets.map((ticket) => {
                                    const PriorityIcon = ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? AlertTriangle : MessageSquare;
                                    return (
                                        <div key={ticket.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                            <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                        <PriorityIcon className="h-4 w-4 text-rose-500" />
                                                        {ticket.subject}
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        #{ticket.id} • {ticket.lockerCode} • {ticket.priority} priority
                                                    </p>
                                                    <p className="text-sm text-gray-600">{ticket.description}</p>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                        <span>Reported by {ticket.reportedBy}</span>
                                                        <span>Channel: {ticket.channel}</span>
                                                        {ticket.nextActionDueAt && (
                                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600">
                                                                Next action {new Date(ticket.nextActionDueAt).toLocaleString()}
                                                            </span>
                                                        )}
                                                        {ticket.tags?.map((tag) => (
                                                            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 text-sm">
                                                    <label className="text-xs font-semibold uppercase text-gray-500">Owner</label>
                                                    <select
                                                        value={ticket.assignedTo || ''}
                                                        onChange={(event) => handleTicketAssignment(ticket.id, event.target.value)}
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {supportOwners.map((owner) => (
                                                            <option key={owner} value={owner === 'Unassigned' ? '' : owner}>
                                                                {owner}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <label className="mt-2 text-xs font-semibold uppercase text-gray-500">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={ticket.status}
                                                        onChange={(event) =>
                                                            handleTicketStatusChange(ticket.id, event.target.value as LockerTicketStatus)
                                                        }
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {ticketStatuses.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status.replaceAll('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {ticket.timeline && ticket.timeline.length > 0 && (
                                                <div className="mt-4 border-t border-gray-100 pt-4">
                                                    <p className="text-xs font-semibold uppercase text-gray-500">Timeline</p>
                                                    <ol className="mt-2 space-y-2 text-xs text-gray-600">
                                                        {ticket.timeline.slice(0, 3).map((event) => (
                                                            <li key={event.id} className="flex items-start gap-2">
                                                                <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-500"></span>
                                                                <div>
                                                                    <p className="font-medium text-gray-700">{event.summary}</p>
                                                                    <p className="text-[11px] uppercase text-gray-400">
                                                                        {event.type.replaceAll('_', ' ')} • {event.author} •{' '}
                                                                        {new Date(event.occurredAt).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Task runway</h3>
                                    <p className="text-sm text-gray-500">
                                        Orchestrate engineering, field ops, and customer comms with a single backlog.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold uppercase text-gray-500">Completion</p>
                                    <p className="text-lg font-bold text-gray-900">{taskProgress}%</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <select
                                    value={taskFilter}
                                    onChange={(event) => setTaskFilter(event.target.value as typeof taskFilter)}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">All tasks</option>
                                    <option value="TODAY">Due today</option>
                                    <option value="OVERDUE">Overdue</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>

                            <div className="mt-4 space-y-3">
                                {filteredTasks.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                        No tasks in this view. Assign owners to critical tickets or log a new follow-up.
                                    </div>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <div key={task.id} className="rounded-lg border border-gray-100 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Owned by {task.owner} • Due {new Date(task.dueDate).toLocaleString()}
                                                    </p>
                                                    {task.relatedTicketId && (
                                                        <p className="mt-1 text-xs text-blue-600">
                                                            Linked ticket: {task.relatedTicketId}
                                                        </p>
                                                    )}
                                                    {task.description && (
                                                        <p className="mt-1 text-xs text-gray-600">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 text-xs">
                                                    <select
                                                        value={task.status}
                                                        onChange={(event) =>
                                                            handleTaskStatusChange(task.id, event.target.value as LockerTaskStatus)
                                                        }
                                                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {taskStatuses.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status.replaceAll('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleSnoozeTask(task.id, 1)}
                                                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        Snooze +1d
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <p className="text-sm font-semibold text-gray-900">Log a new follow-up</p>
                                <div className="mt-3 grid grid-cols-1 gap-3">
                                    <input
                                        type="text"
                                        value={newTaskForm.title}
                                        onChange={(event) => setNewTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                                        placeholder="Task title"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <select
                                            value={newTaskForm.owner}
                                            onChange={(event) => setNewTaskForm((prev) => ({ ...prev, owner: event.target.value }))}
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Assign owner</option>
                                            {supportOwners.map((owner) => (
                                                <option key={owner} value={owner === 'Unassigned' ? '' : owner}>
                                                    {owner}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={newTaskForm.impact}
                                            onChange={(event) =>
                                                setNewTaskForm((prev) => ({
                                                    ...prev,
                                                    impact: event.target.value as LockerTaskImpact,
                                                }))
                                            }
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {taskImpacts.map((impact) => (
                                                <option key={impact} value={impact}>
                                                    {impact} impact
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <input
                                            type="datetime-local"
                                            value={newTaskForm.dueDate}
                                            onChange={(event) => setNewTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <select
                                            value={newTaskForm.relatedTicketId}
                                            onChange={(event) =>
                                                setNewTaskForm((prev) => ({ ...prev, relatedTicketId: event.target.value }))
                                            }
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Link to ticket (optional)</option>
                                            {supportTickets.map((ticket) => (
                                                <option key={ticket.id} value={ticket.id}>
                                                    {ticket.id} — {ticket.subject}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleCreateSupportTask}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        Create task
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Location issue digest</h3>
                            <p className="text-sm text-gray-500">
                                Quickly spot hotspots and align preventive maintenance with customer feedback loops.
                            </p>
                            <div className="mt-4 space-y-3">
                                {supportIssues.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                        No open incidents for locker locations. Keep monitoring the reservation feed for anomalies.
                                    </p>
                                ) : (
                                    supportIssues.map((issue) => (
                                        <div key={issue.locationId} className="rounded-lg border border-gray-100 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{issue.locationName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {issue.activeIssues} active • {issue.escalations} escalations
                                                    </p>
                                                </div>
                                                <span className={cn('text-xs font-semibold uppercase', issueTrendLegend[issue.trend])}>
                                                    Trend {issue.trend.toLowerCase()}
                                                </span>
                                            </div>
                                            {issue.description && (
                                                <p className="mt-2 text-xs text-gray-600">{issue.description}</p>
                                            )}
                                            {issue.lastIncidentAt && (
                                                <p className="mt-1 text-[11px] uppercase text-gray-400">
                                                    Last incident {new Date(issue.lastIncidentAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {nextActionTicket && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-1 h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">Next action due soon</p>
                                        <p className="text-xs text-blue-800">
                                            {nextActionTicket.subject} ({nextActionTicket.priority} priority) requires follow-up by{' '}
                                            {nextActionTicket.assignedTo || 'Unassigned'} at{' '}
                                            {new Date(nextActionTicket.nextActionDueAt ?? '').toLocaleString()}.
                                        </p>
                                        <button
                                            onClick={() => handleTicketStatusChange(nextActionTicket.id, 'IN_PROGRESS')}
                                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Acknowledge
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
                        {activePlansLoading && (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            </div>
                        )}
                        {activePlansError && (
                            <div className="border border-red-100 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
                                {activePlansError}
                            </div>
                        )}
                        {!activePlansLoading && !activePlansError && !activePlans.length && (
                            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                                No active subscriptions found for this user. Try selecting a different user ID.
                            </div>
                        )}
                        {activePlans.slice(0, 3).map((subscription) => {
                            const usedLockers = subscription.currentUsage.totalCapacity - subscription.currentUsage.availableCapacity;
                            const billingLabel = subscription.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly';
                            return (
                                <div key={subscription.id} className="border border-gray-100 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{subscription.subscriptionPlan.planName}</p>
                                            <p className="text-sm text-gray-500">{subscription.location.name}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                            {subscription.subscriptionStatus}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
                                        <div>
                                            <p className="text-gray-400">Billing</p>
                                            <p className="font-semibold text-gray-700">{billingLabel}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Usage</p>
                                            <p className="font-semibold text-gray-700">{usedLockers}/{subscription.currentUsage.totalCapacity} lockers</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Active until</p>
                                            <p className="font-semibold text-gray-700">{new Date(subscription.endDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600">
                                    {plan.sharingEnabled ? 'Sharing enabled' : 'Sharing disabled'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{plan.planName}</h3>
                                    <p className="text-sm text-gray-500">{plan.description || `Plan code: ${plan.planCode}`}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-gray-900">${plan.monthlyPrice}</p>
                                <span className="text-sm text-gray-400">/ month</span>
                            </div>
                            <p className="text-xs text-gray-400">${plan.annualPrice} billed yearly</p>
                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to {plan.lockerCapacity} lockers
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {plan.maxConcurrentReservations} concurrent reservations
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {plan.sharingEnabled
                                        ? `Share with up to ${plan.maxSharedUsers} users`
                                        : 'Sharing disabled'}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Plan code: {plan.planCode}
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
                                        {plan.planName}
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
                                <option value="ANNUAL">Annual</option>
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
                                                <h3 className="text-lg font-semibold text-gray-900">{subscription.subscriptionPlan.planName}</h3>
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{subscription.subscriptionStatus}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {subscription.location.name}
                                                {subscription.location.address ? ` · ${subscription.location.address}` : ''}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                                                <span>
                                                    Billing: <strong>{subscription.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}</strong>
                                                </span>
                                                <span>
                                                    Capacity: <strong>{subscription.subscriptionPlan.lockerCapacity} lockers</strong>
                                                </span>
                                                <span>
                                                    Active reservations: <strong>{subscription.currentUsage.activeReservations}</strong>
                                                </span>
                                                <span>
                                                    Available capacity: <strong>{subscription.currentUsage.availableCapacity}</strong>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                                                onClick={() => {
                                                    setExpandedSubscriptionId(isExpanded ? null : subscription.id);
                                                    setUpgradePlanId('');
                                                    setUpgradeReason('');
                                                }}
                                            >
                                                {isExpanded ? 'Hide details' : 'View details'}
                                            </button>
                                            <button
                                                className="px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                                                onClick={() => {
                                                    setExpandedSubscriptionId(subscription.id);
                                                    setUpgradeState({ loading: false, message: null, error: null });
                                                    setUpgradeReason('');
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
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Usage by member</h4>
                                                    <div className="space-y-3">
                                                        {subscription.currentUsage.usageByUser.length ? (
                                                            subscription.currentUsage.usageByUser.map((usageItem) => (
                                                                <div key={usageItem.userId} className="flex items-center justify-between text-sm text-gray-600">
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800">{usageItem.userName}</p>
                                                                        <p className="text-xs text-gray-400">
                                                                            {usageItem.sharingType === 'OWNER' ? 'Owner access' : 'Shared access'} · Active reservations: {usageItem.activeReservations}
                                                                        </p>
                                                                    </div>
                                                                    {usageItem.allocatedBalance !== null && (
                                                                        <span className="text-xs text-gray-500">Balance: {usageItem.allocatedBalance}</span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-400">Usage data not available.</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="border border-gray-100 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Plan features</h4>
                                                    <div className="text-xs text-gray-500 space-y-1">
                                                        <p>Locker capacity: <strong>{subscription.subscriptionPlan.lockerCapacity}</strong></p>
                                                        <p>Concurrent reservations: <strong>{subscription.subscriptionPlan.maxConcurrentReservations}</strong></p>
                                                        <p>
                                                            Sharing: <strong>{subscription.subscriptionPlan.sharingEnabled ? `Up to ${subscription.subscriptionPlan.maxSharedUsers} shared users` : 'Disabled'}</strong>
                                                        </p>
                                                        <p>
                                                            Available capacity: <strong>{subscription.currentUsage.availableCapacity} / {subscription.currentUsage.totalCapacity}</strong>
                                                        </p>
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
                                                        {plans.filter((plan) => plan.id !== subscription.subscriptionPlan.id).map((plan) => (
                                                            <option key={plan.id} value={plan.id}>{plan.planName}</option>
                                                        ))}
                                                    </select>
                                                    <div className="flex-1">
                                                        <label className="text-xs text-gray-500">Reason for upgrade</label>
                                                        <textarea
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows={2}
                                                            value={upgradeReason}
                                                            onChange={(event) => setUpgradeReason(event.target.value)}
                                                            placeholder="Explain why this subscription needs more capacity"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-3 self-start lg:self-auto">
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500">Invitee email</label>
                                                        <input
                                                            type="email"
                                                            value={sharingForm.userEmail}
                                                            onChange={(event) => setSharingForm((prev) => ({ ...prev, userEmail: event.target.value }))}
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                            placeholder="user@example.com"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Sharing type</label>
                                                        <select
                                                            value={sharingForm.sharingType}
                                                            onChange={(event) => {
                                                                const newType = event.target.value as ShareSubscriptionRequest['sharingType'];
                                                                setSharingForm((prev) => ({
                                                                    ...prev,
                                                                    sharingType: newType,
                                                                    allocatedBalance: newType === 'OWNER' ? null : prev.allocatedBalance ?? 1,
                                                                    accessLevel:
                                                                        newType === 'OWNER'
                                                                            ? 'FULL_ACCESS'
                                                                            : prev.accessLevel === 'FULL_ACCESS'
                                                                                ? 'BASIC_ACCESS'
                                                                                : prev.accessLevel,
                                                                }));
                                                            }}
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <option value="BASIC">Basic</option>
                                                            <option value="OWNER">Owner</option>
                                                        </select>
                                                    </div>
                                                    {sharingForm.sharingType === 'BASIC' && (
                                                        <div>
                                                            <label className="text-xs text-gray-500">Allocated balance</label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={sharingForm.allocatedBalance ?? 1}
                                                                onChange={(event) =>
                                                                    setSharingForm((prev) => ({
                                                                        ...prev,
                                                                        allocatedBalance: Number(event.target.value) > 0 ? Number(event.target.value) : 1,
                                                                    }))
                                                                }
                                                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                                placeholder="e.g. 2"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="text-xs text-gray-500">Access level</label>
                                                        <select
                                                            value={sharingForm.accessLevel}
                                                            onChange={(event) =>
                                                                setSharingForm((prev) => ({
                                                                    ...prev,
                                                                    accessLevel: event.target.value as ShareSubscriptionRequest['accessLevel'],
                                                                }))
                                                            }
                                                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <option value="BASIC_ACCESS" disabled={sharingForm.sharingType === 'OWNER'}>Basic locker access</option>
                                                            <option value="FULL_ACCESS">Full management access</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <label className="text-xs text-gray-500">Invitation message</label>
                                                    <textarea
                                                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        rows={3}
                                                        value={sharingForm.invitationMessage || ''}
                                                        onChange={(event) => setSharingForm((prev) => ({ ...prev, invitationMessage: event.target.value }))}
                                                        placeholder="Hi! I’d like to share locker access with you."
                                                    />
                                                </div>
                                                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Info className="w-4 h-4 text-blue-500" />
                                                        Invitees will receive an email with their access instructions.
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
                                                            <p>Active reservations: <strong>{usage.activeReservations}</strong></p>
                                                            <p>Available lockers: <strong>{usage.availableCapacity}</strong></p>
                                                            <p>Total capacity: <strong>{usage.totalCapacity}</strong></p>
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-xs font-semibold text-gray-700">Top members</p>
                                                                {(usage.usageByUser ?? []).slice(0, 3).map((member) => (
                                                                    <p key={member.userId} className="text-gray-500">
                                                                        {member.userName} · {member.activeReservations} active{member.allocatedBalance !== null ? ` · balance ${member.allocatedBalance}` : ''}
                                                                    </p>
                                                                ))}
                                                                {!usage.usageByUser.length && <p className="text-gray-400">No usage recorded yet.</p>}
                                                            </div>
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
                                    <p className="text-sm font-semibold text-gray-900">{subscription.subscriptionPlan.planName} · {subscription.location.name}</p>
                                    <p className="text-xs text-gray-500">Status: {subscription.subscriptionStatus}</p>
                                    <p className="text-xs text-gray-400">Available capacity: {subscription.currentUsage.availableCapacity}/{subscription.currentUsage.totalCapacity}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Owner ID #{subscription.ownerUserId}
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
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                <button
                                    onClick={() => {
                                        setAvailabilityScope('SPECIFIC_USER');
                                        setAvailabilityForm((prev) => ({
                                            ...prev,
                                            userScope: 'SPECIFIC_USER',
                                            userId: selectedUserId || prev.userId || undefined,
                                        }));
                                    }}
                                    className={cn(
                                        'px-3 py-2 rounded-lg border',
                                        availabilityScope === 'SPECIFIC_USER'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    )}
                                    type="button"
                                >
                                    Specific user
                                </button>
                                <button
                                    onClick={() => {
                                        setAvailabilityScope('ALL_USERS');
                                        setAvailabilityForm((prev) => ({
                                            ...prev,
                                            userScope: 'ALL_USERS',
                                            userId: undefined,
                                        }));
                                    }}
                                    className={cn(
                                        'px-3 py-2 rounded-lg border',
                                        availabilityScope === 'ALL_USERS'
                                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    )}
                                    type="button"
                                >
                                    All users
                                </button>
                            </div>
                            {availabilityScope === 'SPECIFIC_USER' ? (
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">User ID</label>
                                    <input
                                        type="number"
                                        value={availabilityForm.userId ?? ''}
                                        onChange={(event) =>
                                            setAvailabilityForm((prev) => ({
                                                ...prev,
                                                userId: event.target.value ? Number(event.target.value) : undefined,
                                            }))
                                        }
                                        placeholder="Enter user ID"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Checking availability across all members with access to this location.
                                </p>
                            )}
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
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                <button
                                    onClick={() => {
                                        setReservationScope('SPECIFIC_USER');
                                        setReservationForm((prev) => ({
                                            ...prev,
                                            userScope: 'SPECIFIC_USER',
                                            userId: selectedUserId || prev.userId || undefined,
                                        }));
                                    }}
                                    className={cn(
                                        'px-3 py-2 rounded-lg border',
                                        reservationScope === 'SPECIFIC_USER'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    )}
                                    type="button"
                                >
                                    Specific user
                                </button>
                                <button
                                    onClick={() => {
                                        setReservationScope('ALL_USERS');
                                        setReservationForm((prev) => ({
                                            ...prev,
                                            userScope: 'ALL_USERS',
                                            userId: undefined,
                                        }));
                                    }}
                                    className={cn(
                                        'px-3 py-2 rounded-lg border',
                                        reservationScope === 'ALL_USERS'
                                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    )}
                                    type="button"
                                >
                                    All users
                                </button>
                            </div>
                            {reservationScope === 'SPECIFIC_USER' ? (
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">User ID</label>
                                    <input
                                        type="number"
                                        value={reservationForm.userId ?? ''}
                                        onChange={(event) =>
                                            setReservationForm((prev) => ({
                                                ...prev,
                                                userId: event.target.value ? Number(event.target.value) : undefined,
                                            }))
                                        }
                                        placeholder="Enter user ID"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Reserve capacity without assigning it to a specific member. You can link the reservation later.
                                </p>
                            )}
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

    const renderLocationsManagement = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Locations & lockers</h2>
                    <p className="text-gray-500">Review every site with its lockers, availability, and open issues.</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    onClick={() => {
                        setLocationHierarchyLoading(true);
                        lockerManagementService
                            .getLocationsHierarchy(token)
                            .then((response) => {
                                setLocationHierarchy(response.data);
                                setLocationHierarchyError(null);
                                if (response.errors?.includes('FALLBACK_DATA')) {
                                    pushToast({
                                        type: 'warning',
                                        title: 'Limited data',
                                        description:
                                            response.message ||
                                            'Showing cached location structure while live data is unavailable.',
                                    });
                                }
                            })
                            .catch((error) => {
                                const description =
                                    error instanceof Error ? error.message : 'Unexpected error refreshing locations.';
                                setLocationHierarchyError(description);
                                pushToast({ type: 'error', title: 'Unable to refresh locations', description });
                            })
                            .finally(() => setLocationHierarchyLoading(false));
                    }}
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {locationHierarchyLoading ? (
                <div className="flex justify-center items-center h-56">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : locationHierarchyError ? (
                <div className="border border-red-100 bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">
                    {locationHierarchyError}
                </div>
            ) : (
                <div className="space-y-6">
                    {locationHierarchy.map((entry) => (
                        <div key={entry.location.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{entry.location.name}</h3>
                                            <p className="text-sm text-gray-500">{entry.location.address}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                                        <span>
                                            Total lockers: <strong>{entry.totalLockers}</strong>
                                        </span>
                                        <span>
                                            Available: <strong className="text-emerald-600">{entry.availableLockers}</strong>
                                        </span>
                                        <span>
                                            Issues: <strong className="text-amber-600">{entry.issueCount ?? 0}</strong>
                                        </span>
                                        <span>
                                            Maintenance: <strong className="text-indigo-600">{entry.maintenanceCount ?? 0}</strong>
                                        </span>
                                    </div>
                                </div>
                                {entry.location.features?.length ? (
                                    <div className="text-xs text-gray-500 max-w-sm">
                                        <p className="font-semibold text-gray-700">Features</p>
                                        <p>{entry.location.features.join(' · ')}</p>
                                    </div>
                                ) : null}
                            </div>
                            <div className="p-6 overflow-x-auto">
                                {entry.lockers.length ? (
                                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500">
                                                <th className="py-2 pr-4 font-medium">Locker</th>
                                                <th className="py-2 pr-4 font-medium">Size</th>
                                                <th className="py-2 pr-4 font-medium">Status</th>
                                                <th className="py-2 pr-4 font-medium">Subscription</th>
                                                <th className="py-2 pr-4 font-medium">Next available</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-700">
                                            {entry.lockers.map((locker) => (
                                                <tr key={locker.id} className="hover:bg-gray-50">
                                                    <td className="py-3 pr-4">
                                                        <div className="font-semibold text-gray-900">{locker.code || `Locker ${locker.lockerNumber}`}</div>
                                                        <div className="text-xs text-gray-400">#{locker.lockerNumber}</div>
                                                    </td>
                                                    <td className="py-3 pr-4">{locker.size}</td>
                                                    <td className="py-3 pr-4">
                                                        <span
                                                            className={cn(
                                                                'px-2 py-1 rounded-full text-xs font-semibold',
                                                                locker.status === 'AVAILABLE'
                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                    : locker.status === 'MAINTENANCE' || locker.status === 'OUT_OF_SERVICE'
                                                                    ? 'bg-amber-50 text-amber-600'
                                                                    : 'bg-slate-100 text-slate-600'
                                                            )}
                                                        >
                                                            {locker.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-xs text-gray-500">{locker.subscriptionId || '—'}</td>
                                                    <td className="py-3 pr-4 text-xs text-gray-500">
                                                        {locker.nextAvailableFrom
                                                            ? new Date(locker.nextAvailableFrom).toLocaleString()
                                                            : locker.status === 'AVAILABLE'
                                                            ? 'Now'
                                                            : 'TBD'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-sm text-gray-500">No lockers registered for this location.</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {!locationHierarchy.length && (
                        <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                            No locations found. Add a location to start managing lockers.
                        </div>
                    )}
                </div>
            )}
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
            {activeTab === 'locations' && renderLocationsManagement()}
            {activeTab === 'lockers' && renderLockers()}
            {activeTab === 'reservations' && renderReservations()}
            {activeTab === 'support' && renderSupport()}
        </div>
    );
}

export default LockerManagementDashboard;
