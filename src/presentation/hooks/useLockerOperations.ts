'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../components/ui/toast';
import {
    LockerDetails,
    LockerIssue,
    LockerMaintenanceRecord,
    LockerReservation,
    LockerSummary,
} from '../../core/entities/lockers';
import {
    BulkCreateLockerPayload,
    CreateIssuePayload,
    CreateLockerPayload,
    LockerIssuesMaintenanceOverview,
    LockerLocationDigest,
    LockerLocationOverview,
    LockerSubscriptionDigest,
    ScheduleMaintenancePayload,
    UpdateIssuePayload,
    UpdateLockerStatusPayload,
    UpdateMaintenancePayload,
} from '../../core/entities/locker-operations';
import { lockerOperationsService } from '../../infrastructure/services/locker-operations.service';

interface LockerOperationsState {
    lockers: LockerSummary[];
    locations: LockerLocationDigest[];
    locationOverview: LockerLocationOverview | null;
    selectedLocationId: string | null;
    selectedLockerId: string | null;
    selectedLocker: LockerDetails | null;
    issues: LockerIssue[];
    maintenanceRecords: LockerMaintenanceRecord[];
    reservations: LockerReservation[];
    subscriptions: LockerSubscriptionDigest[];
    loadingList: boolean;
    loadingOverview: boolean;
    loadingLockerInsights: boolean;
    pagination: {
        page: number;
        size: number;
        totalElements: number;
    };
}

const INITIAL_STATE: LockerOperationsState = {
    lockers: [],
    locations: [],
    locationOverview: null,
    selectedLocationId: null,
    selectedLockerId: null,
    selectedLocker: null,
    issues: [],
    maintenanceRecords: [],
    reservations: [],
    subscriptions: [],
    loadingList: false,
    loadingOverview: false,
    loadingLockerInsights: false,
    pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
    },
};

export function useLockerOperations() {
    const { pushToast } = useToast();
    const [state, setState] = useState<LockerOperationsState>(INITIAL_STATE);
    const mountedRef = useRef(true);

    const setPartialState = useCallback((partial: Partial<LockerOperationsState>) => {
        if (!mountedRef.current) return;
        setState((prev) => ({ ...prev, ...partial }));
    }, []);

    // ==============================================================
    // CORE LOADERS
    // ==============================================================

    const loadLockerInsights = useCallback(
        async (lockerId: string, updateSelectedLocker = true) => {
            if (!lockerId || state.loadingLockerInsights) return;

            setPartialState({ loadingLockerInsights: true });
            try {
                const overview: LockerIssuesMaintenanceOverview =
                    await lockerOperationsService.getLockerIssuesAndMaintenance(lockerId);

                const selectedLocker = updateSelectedLocker
                    ? (state.locationOverview?.lockers.find((locker) => locker.id === lockerId) as LockerDetails | undefined) ??
                    state.lockers.find((locker) => locker.id === lockerId) ??
                    null
                    : state.selectedLocker;

                setState((prev) => ({
                    ...prev,
                    selectedLockerId: lockerId,
                    selectedLocker: selectedLocker as LockerDetails | null,
                    issues: overview.issues,
                    maintenanceRecords: overview.maintenanceRecords,
                    loadingLockerInsights: false,
                }));
            } catch (error) {
                console.error('Failed to load locker insights', error);
                pushToast({
                    title: 'Unable to load locker details',
                    description: error instanceof Error ? error.message : 'Unexpected error fetching locker insights.',
                    type: 'error',
                });
                setPartialState({ loadingLockerInsights: false });
            }
        },
        [pushToast, setPartialState, state.locationOverview?.lockers, state.lockers, state.selectedLocker, state.loadingLockerInsights]
    );

    const loadLocationOverview = useCallback(
        async (locationId: string, resetLockerSelection = true) => {
            if (!locationId || state.loadingOverview) return;

            setPartialState({ loadingOverview: true });
            try {
                const overview: LockerLocationOverview = await lockerOperationsService.getLocationOverview(locationId);

                const lockers = overview.lockers.length ? overview.lockers : state.lockers;
                const selectedLockerId = resetLockerSelection
                    ? lockers[0]?.id ?? null
                    : state.selectedLockerId && lockers.some((locker) => locker.id === state.selectedLockerId)
                        ? state.selectedLockerId
                        : lockers[0]?.id ?? null;
                const selectedLocker = selectedLockerId
                    ? (lockers.find((locker) => locker.id === selectedLockerId) as LockerDetails | undefined) ?? null
                    : null;

                setState((prev) => ({
                    ...prev,
                    locationOverview: overview,
                    reservations: overview.reservations,
                    subscriptions: overview.subscriptions,
                    selectedLocationId: locationId,
                    selectedLockerId,
                    selectedLocker,
                    lockers,
                    loadingOverview: false,
                    pagination: {
                        page: 0,
                        size: lockers.length,
                        totalElements: lockers.length,
                    },
                }));

                // Fetch issues/maintenance for selected locker
                if (selectedLockerId) {
                    await loadLockerInsights(selectedLockerId, false);
                } else {
                    setPartialState({ issues: [], maintenanceRecords: [], loadingLockerInsights: false });
                }
            } catch (error) {
                console.error('Failed to load location overview', error);
                pushToast({
                    title: 'Unable to load location details',
                    description: error instanceof Error ? error.message : 'Unexpected error fetching location overview.',
                    type: 'error',
                });
                setPartialState({ loadingOverview: false });
            }
        },
        [loadLockerInsights, pushToast, setPartialState, state.lockers, state.selectedLockerId, state.loadingOverview]
    );

    const loadLocations = useCallback(
        async (preferredLocationId?: string, options: { skipOverview?: boolean } = {}) => {
            if (state.loadingList) return;

            setPartialState({ loadingList: true });
            try {
                const digests = await lockerOperationsService.getLocationDigests();
                const nextLocationId = preferredLocationId ?? state.selectedLocationId ?? digests[0]?.id ?? null;

                setState((prev) => ({
                    ...prev,
                    locations: digests,
                    loadingList: false,
                }));

                if (!options.skipOverview && nextLocationId) {
                    await loadLocationOverview(nextLocationId, true);
                } else if (!nextLocationId) {
                    setState((prev) => ({
                        ...prev,
                        selectedLocationId: null,
                        selectedLockerId: null,
                        selectedLocker: null,
                        locationOverview: null,
                        lockers: [],
                        reservations: [],
                        subscriptions: [],
                        loadingOverview: false,
                        loadingLockerInsights: false,
                        pagination: { page: 0, size: 0, totalElements: 0 },
                    }));
                }
            } catch (error) {
                console.error('Failed to load locations', error);
                pushToast({
                    title: 'Unable to load locations',
                    description: error instanceof Error ? error.message : 'Unexpected error fetching locations.',
                    type: 'error',
                });
                setPartialState({ loadingList: false });
            }
        },
        [loadLocationOverview, pushToast, setPartialState, state.selectedLocationId, state.loadingList]
    );

    // ==============================================================
    // INITIAL LOAD (MOUNT)
    // ==============================================================

    useEffect(() => {
        mountedRef.current = true;
        loadLocations().catch((error) => console.error('Initial locker locations load failed', error));
        return () => {
            mountedRef.current = false;
        };
        // ✅ Run only once on mount to avoid infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ==============================================================
    // MUTATION OPERATIONS
    // ==============================================================

    const createLocker = useCallback(
        async (payload: CreateLockerPayload) => {
            await lockerOperationsService.createLocker(payload);
            pushToast({
                title: 'Locker created',
                description: `${payload.name} has been created successfully`,
                type: 'success',
            });
            await loadLocationOverview(payload.locationId, false);
            await loadLocations(payload.locationId, { skipOverview: true });
        },
        [loadLocationOverview, loadLocations, pushToast]
    );

    const bulkCreateLockers = useCallback(
        async (payload: BulkCreateLockerPayload) => {
            const result = await lockerOperationsService.bulkCreateLockers(payload);
            pushToast({
                title: 'Lockers created',
                description: result.message,
                type: 'success',
            });
            await loadLocationOverview(payload.locationId, false);
            await loadLocations(payload.locationId, { skipOverview: true });
        },
        [loadLocationOverview, loadLocations, pushToast]
    );

    const updateLockerStatus = useCallback(
        async (lockerId: string, payload: UpdateLockerStatusPayload) => {
            await lockerOperationsService.updateLockerStatus(lockerId, payload);
            pushToast({
                title: 'Locker status updated',
                description: 'Locker status has been updated successfully.',
                type: 'success',
            });
            if (state.selectedLocationId) {
                await loadLocationOverview(state.selectedLocationId, false);
                await loadLocations(state.selectedLocationId, { skipOverview: true });
            }
            await loadLockerInsights(lockerId, true);
        },
        [loadLocationOverview, loadLocations, loadLockerInsights, pushToast, state.selectedLocationId]
    );

    const createIssue = useCallback(
        async (payload: CreateIssuePayload) => {
            const issue = await lockerOperationsService.createIssue(payload);
            pushToast({
                title: 'Issue reported',
                description: issue.title,
                type: 'success',
            });
            await loadLockerInsights(payload.lockerId, true);
        },
        [loadLockerInsights, pushToast]
    );

    const updateIssue = useCallback(
        async (issueId: string, payload: UpdateIssuePayload, lockerId: string) => {
            await lockerOperationsService.updateIssue(issueId, payload);
            pushToast({
                title: 'Issue updated',
                description: 'Issue status has been updated.',
                type: 'success',
            });
            await loadLockerInsights(lockerId, true);
        },
        [loadLockerInsights, pushToast]
    );

    const addIssueComment = useCallback(
        async (issueId: string, lockerId: string, comment: { comment: string; isInternal?: boolean }) => {
            await lockerOperationsService.addIssueComment(issueId, comment);
            pushToast({
                title: 'Comment added',
                description: 'Your comment has been posted.',
                type: 'success',
            });
            await loadLockerInsights(lockerId, true);
        },
        [loadLockerInsights, pushToast]
    );

    const scheduleMaintenance = useCallback(
        async (lockerId: string, payload: ScheduleMaintenancePayload) => {
            await lockerOperationsService.scheduleMaintenance(lockerId, payload);
            pushToast({
                title: 'Maintenance scheduled',
                description: 'Maintenance task has been created successfully.',
                type: 'success',
            });
            await loadLockerInsights(lockerId, true);
        },
        [loadLockerInsights, pushToast]
    );

    const updateMaintenance = useCallback(
        async (maintenanceId: string, payload: UpdateMaintenancePayload, lockerId: string) => {
            await lockerOperationsService.updateMaintenance(maintenanceId, payload);
            pushToast({
                title: 'Maintenance updated',
                description: 'Maintenance record updated successfully.',
                type: 'success',
            });
            await loadLockerInsights(lockerId, true);
        },
        [loadLockerInsights, pushToast]
    );

    // ==============================================================
    // DERIVED SELECTORS
    // ==============================================================

    const selectedLocation = useMemo(() => {
        if (!state.selectedLocationId) return null;
        return state.locations.find((location) => location.id === state.selectedLocationId) ?? null;
    }, [state.locations, state.selectedLocationId]);

    // ==============================================================
    // RETURN API
    // ==============================================================

    return {
        ...state,
        selectedLocation,
        loadLocations,
        loadLocationOverview,
        loadLockerInsights,
        createLocker,
        bulkCreateLockers,
        updateLockerStatus,
        createIssue,
        updateIssue,
        addIssueComment,
        scheduleMaintenance,
        updateMaintenance,
        setSelectedLocationId: (locationId: string) => loadLocationOverview(locationId),
        setSelectedLockerId: (lockerId: string) => loadLockerInsights(lockerId),
    };
}
