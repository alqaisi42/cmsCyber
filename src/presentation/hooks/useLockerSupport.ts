// src/presentation/hooks/useLockerSupport.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { lockerAdminRepository } from '../../infrastructure/repositories/locker-admin.repository';
import {
    LockerSummary,
    LockerDetails,
    LockerIssue,
    LockerMaintenanceRecord,
    UpdateLockerIssuePayload,
    ResolveLockerIssuePayload,
    LockerStatus,
    LockerIssueStatus,
} from '../../core/entities/lockers';
import {useToast} from "@/presentation/components/ui/toast";

// ==========================================
// MAIN HOOK - useLockerSupport
// ==========================================

export function useLockerSupport() {
    const { pushToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for lockers
    const [lockers, setLockers] = useState<LockerSummary[]>([]);
    const [selectedLocker, setSelectedLocker] = useState<LockerDetails | null>(null);

    // Load all out-of-service lockers
    const loadOutOfServiceLockers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await lockerAdminRepository.getAllLockers({
                status: 'OUT_OF_SERVICE',
                page: 0,
                pageSize: 100,
            });
            setLockers(response.data);
            return response.data;
        } catch (err) {
            const message = 'Failed to load lockers';
            setError(message);
            pushToast({
                type: 'error',
                title: 'Error',
                description: message,
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [pushToast]);

    // Load locker details
    const loadLockerDetails = useCallback(async (lockerId: string) => {
        setLoading(true);
        setError(null);
        try {
            const details = await lockerAdminRepository.getLockerById(lockerId);
            setSelectedLocker(details);
            return details;
        } catch (err) {
            const message = 'Failed to load locker details';
            setError(message);
            pushToast({
                type: 'error',
                title: 'Error',
                description:message,
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [pushToast]);

    // Update locker status
    const updateLockerStatus = useCallback(async (
        lockerId: string,
        status: LockerStatus,
        reason?: string
    ) => {
        try {
            const updated = await lockerAdminRepository.updateLockerStatus(lockerId, {
                status,
                reason,
            });

            // Update local state
            setLockers(prev => prev.map(l =>
                l.id === lockerId ? { ...l, status } : l
            ));

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Locker status updated successfully',
            });

            return updated;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to update locker status',
            });
            throw err;
        }
    }, [pushToast]);

    return {
        loading,
        error,
        lockers,
        selectedLocker,
        loadOutOfServiceLockers,
        loadLockerDetails,
        updateLockerStatus,
    };
}

// ==========================================
// HOOK - useLockerIssues
// ==========================================

export function useLockerIssues(lockerId?: string) {
    const { pushToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [issues, setIssues] = useState<LockerIssue[]>([]);

    // Load issues for a specific locker
    const loadLockerIssues = useCallback(async (id?: string) => {
        const targetId = id || lockerId;
        if (!targetId) return;

        setLoading(true);
        try {
            const data = await lockerAdminRepository.getLockerIssues(targetId);
            setIssues(data);
            return data;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to load issues',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [lockerId, pushToast]);

    // Load all open issues
    const loadAllOpenIssues = useCallback(async () => {
        setLoading(true);
        try {
            const data = await lockerAdminRepository.getAllOpenIssues();
            setIssues(data);
            return data;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to load open issues',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [pushToast]);

    // Update issue
    const updateIssue = useCallback(async (
        issueId: string,
        payload: UpdateLockerIssuePayload
    ) => {
        try {
            const updated = await lockerAdminRepository.updateIssue(issueId, payload);

            // Update local state
            setIssues(prev => prev.map(i =>
                i.id === issueId ? updated : i
            ));

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Issue updated successfully',
            });

            return updated;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to update issue',
            });
            throw err;
        }
    }, [pushToast]);

    // Resolve issue
    const resolveIssue = useCallback(async (
        issueId: string,
        payload: ResolveLockerIssuePayload
    ) => {
        try {
            const resolved = await lockerAdminRepository.resolveIssue(issueId, payload);

            // Update local state
            setIssues(prev => prev.map(i =>
                i.id === issueId ? resolved : i
            ));

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Issue resolved successfully',
            });

            return resolved;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to resolve issue',
            });
            throw err;
        }
    }, [pushToast]);

    // Report new issue
    const reportIssue = useCallback(async (data: {
        lockerId: string;
        issueType: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        title: string;
        description: string;
        reportedBy: string;
    }) => {
        try {
            const newIssue = await lockerAdminRepository.reportIssue(data);

            // Add to local state
            setIssues(prev => [...prev, newIssue]);

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Issue reported successfully',
            });

            return newIssue;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to report issue',
            });
            throw err;
        }
    }, [pushToast]);

    // Load issues on mount if lockerId provided
    useEffect(() => {
        if (lockerId) {
            loadLockerIssues();
        }
    }, [lockerId, loadLockerIssues]);

    return {
        loading,
        issues,
        loadLockerIssues,
        loadAllOpenIssues,
        updateIssue,
        resolveIssue,
        reportIssue,
    };
}

// ==========================================
// HOOK - useMaintenanceHistory
// ==========================================

export function useMaintenanceHistory(lockerId?: string) {
    const { pushToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<LockerMaintenanceRecord[]>([]);

    // Load maintenance history
    const loadMaintenanceHistory = useCallback(async (id?: string) => {
        const targetId = id || lockerId;
        if (!targetId) return;

        setLoading(true);
        try {
            const data = await lockerAdminRepository.getMaintenanceHistory(targetId);
            setHistory(data);
            return data;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to load maintenance history',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [lockerId, pushToast]);

    // Schedule maintenance
    const scheduleMaintenance = useCallback(async (
        targetLockerId: string,
        data: {
            maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
            scheduledDate: string;
            estimatedDurationHours: number;
            assignedTo: string;
            tasks: string[];
            notes?: string;
        }
    ) => {
        try {
            const scheduled = await lockerAdminRepository.scheduleMaintenance(
                targetLockerId,
                data
            );

            // Add to local state
            setHistory(prev => [...prev, scheduled]);

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Maintenance scheduled successfully',
            });

            return scheduled;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to schedule maintenance',
            });
            throw err;
        }
    }, [pushToast]);

    // Complete maintenance
    const completeMaintenance = useCallback(async (
        maintenanceId: string,
        data: {
            actualDurationHours: number;
            completedTasks: string[];
            findings?: string;
            partsUsed?: string[];
            laborHours?: number;
            totalCost?: number;
            nextMaintenanceDue?: string;
            notes?: string;
        }
    ) => {
        try {
            const completed = await lockerAdminRepository.completeMaintenance(
                maintenanceId,
                data
            );

            // Update local state
            setHistory(prev => prev.map(h =>
                h.id === maintenanceId ? completed : h
            ));

            pushToast({
                type: 'success',
                title: 'Success',
                description: 'Maintenance completed successfully',
            });

            return completed;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to complete maintenance',
            });
            throw err;
        }
    }, [pushToast]);

    // Load history on mount if lockerId provided
    useEffect(() => {
        if (lockerId) {
            loadMaintenanceHistory();
        }
    }, [lockerId, loadMaintenanceHistory]);

    return {
        loading,
        history,
        loadMaintenanceHistory,
        scheduleMaintenance,
        completeMaintenance,
    };
}

// ==========================================
// HOOK - useAllOpenIssues
// ==========================================

export function useAllOpenIssues() {
    const { pushToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [issues, setIssues] = useState<LockerIssue[]>([]);

    const loadIssues = useCallback(async () => {
        setLoading(true);
        try {
            const data = await lockerAdminRepository.getAllOpenIssues();
            setIssues(data);
            return data;
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error',
                description: 'Failed to load open issues',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [pushToast]);

    useEffect(() => {
        loadIssues();
    }, [loadIssues]);

    return {
        loading,
        issues,
        refresh: loadIssues,
    };
}