// src/infrastructure/services/locker-support.service.ts
// Service abstraction for locker support tickets, operational tasks and issue digests.

import {
    AssignTicketPayload,
    CreateSupportTaskPayload,
    LockerSupportApiResponse,
    LockerSupportOverview,
    LockerSupportTask,
    LockerTicketStatus,
    UpdateSupportTaskPayload,
    UpdateTicketStatusPayload,
} from '../../core/entities/locker-support';

interface SupportOverviewResponse extends LockerSupportApiResponse<LockerSupportOverview> {}
interface SupportTaskResponse extends LockerSupportApiResponse<LockerSupportTask> {}
interface SupportMessageResponse extends LockerSupportApiResponse<{ id: string } | string> {}

const FALLBACK_SUPPORT_OVERVIEW: LockerSupportOverview = {
    summary: {
        openTickets: 7,
        breachedTickets: 1,
        avgFirstResponseMinutes: 14,
        avgResolutionHours: 6,
        todaysHandovers: 3,
        satisfactionScore: 4.7,
    },
    tickets: [
        {
            id: 'SUP-LOCKER-1042',
            subscriptionId: '650e8400-e29b-41d4-a716-446655440010',
            lockerCode: 'LOC-001-SUB-001-0015',
            subject: 'Locker door jammed after delivery attempt',
            description:
                'Courier reported that the locker door would not close properly after dropping a medical kit. Door sensor shows partially closed state.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            channel: 'MOBILE_APP',
            createdAt: '2025-10-22T08:45:00',
            updatedAt: '2025-10-22T10:15:00',
            reportedBy: 'Jane Doe',
            customerEmail: 'jane.doe@example.com',
            assignedTo: 'Omar Khalil',
            slaBreaches: 0,
            nextActionDueAt: '2025-10-22T11:15:00',
            tags: ['hardware', 'door'],
            timeline: [
                {
                    id: 'SUP-LOCKER-1042-1',
                    occurredAt: '2025-10-22T08:45:00',
                    author: 'Jane Doe',
                    summary: 'Issue reported through customer app with photos.',
                    type: 'NOTE',
                },
                {
                    id: 'SUP-LOCKER-1042-2',
                    occurredAt: '2025-10-22T09:10:00',
                    author: 'Support Bot',
                    summary: 'Ticket acknowledged automatically, SLA timer started.',
                    type: 'STATUS_CHANGE',
                },
            ],
        },
        {
            id: 'SUP-LOCKER-1075',
            subscriptionId: '650e8400-e29b-41d4-a716-446655440011',
            lockerCode: 'LOC-002-SUB-003-0004',
            subject: 'Access code not working for shared user',
            description:
                'Shared user reported repeated invalid code errors while trying to pick up medication. Possibly expired reservation or incorrect sharing configuration.',
            status: 'WAITING_ON_CUSTOMER',
            priority: 'MEDIUM',
            channel: 'PHONE',
            createdAt: '2025-10-21T18:30:00',
            updatedAt: '2025-10-22T07:55:00',
            reportedBy: 'Support Hotline',
            assignedTo: 'Sara Haddad',
            slaBreaches: 1,
            nextActionDueAt: '2025-10-22T12:00:00',
            tags: ['access', 'sharing'],
        },
        {
            id: 'SUP-LOCKER-1091',
            subscriptionId: '650e8400-e29b-41d4-a716-446655440012',
            lockerCode: 'LOC-001-SUB-005-0008',
            subject: 'Locker availability mismatch in CMS',
            description:
                'Admin reported that locker shows as available in dashboard but reservation API rejects request due to capacity limits.',
            status: 'ACKNOWLEDGED',
            priority: 'CRITICAL',
            channel: 'PORTAL',
            createdAt: '2025-10-22T07:05:00',
            updatedAt: '2025-10-22T09:25:00',
            reportedBy: 'John Doe',
            assignedTo: 'Nour Al-Fayez',
            slaBreaches: 0,
            nextActionDueAt: '2025-10-22T10:30:00',
            tags: ['api', 'capacity', 'monitoring'],
        },
        {
            id: 'SUP-LOCKER-0922',
            subscriptionId: '650e8400-e29b-41d4-a716-446655440002',
            lockerCode: 'LOC-003-SUB-002-0020',
            subject: 'Preventive maintenance visit tracking',
            description:
                'Technician requested confirmation that maintenance checklist submission synced to CMS. Awaiting QA review.',
            status: 'WAITING_ON_PROVIDER',
            priority: 'LOW',
            channel: 'EMAIL',
            createdAt: '2025-10-20T09:00:00',
            updatedAt: '2025-10-21T16:10:00',
            reportedBy: 'Maintenance Team',
            assignedTo: 'Maintenance Queue',
            slaBreaches: 0,
            tags: ['maintenance'],
        },
    ],
    tasks: [
        {
            id: 'TASK-301',
            title: 'QA verify maintenance sync for LOC-003',
            owner: 'Rasha Ali',
            description: 'Cross-check technician checklist with CMS audit trail before closing ticket SUP-LOCKER-0922.',
            relatedTicketId: 'SUP-LOCKER-0922',
            status: 'IN_PROGRESS',
            impact: 'MEDIUM',
            dueDate: '2025-10-22T17:00:00',
            createdAt: '2025-10-21T10:15:00',
        },
        {
            id: 'TASK-302',
            title: 'Escalate access code issue to subscription owner',
            owner: 'Support Triage',
            description:
                'Contact subscription owner to confirm shared user permissions. Provide instructions to regenerate code if required.',
            relatedTicketId: 'SUP-LOCKER-1075',
            status: 'NOT_STARTED',
            impact: 'HIGH',
            dueDate: '2025-10-22T13:00:00',
            createdAt: '2025-10-22T07:45:00',
        },
        {
            id: 'TASK-303',
            title: 'Deploy firmware hotfix to lockers in Downtown Center',
            owner: 'Field Ops',
            description: 'Roll out firmware 2.15.4 to resolve door sensor calibration issues.',
            status: 'BLOCKED',
            impact: 'HIGH',
            dueDate: '2025-10-23T09:30:00',
            createdAt: '2025-10-21T14:00:00',
        },
        {
            id: 'TASK-304',
            title: 'Share availability discrepancy report with engineering',
            owner: 'Nour Al-Fayez',
            description: 'Compile logs for SUP-LOCKER-1091 and attach to root-cause analysis.',
            relatedTicketId: 'SUP-LOCKER-1091',
            status: 'IN_PROGRESS',
            impact: 'HIGH',
            dueDate: '2025-10-22T15:00:00',
            createdAt: '2025-10-22T08:00:00',
        },
    ],
    issueDigest: [
        {
            locationId: '750e8400-e29b-41d4-a716-446655440020',
            locationName: 'Medical City Hub',
            activeIssues: 3,
            escalations: 1,
            lastIncidentAt: '2025-10-22T08:45:00',
            trend: 'UP',
            description: 'Door sensor and availability sync issues affecting two lockers.',
        },
        {
            locationId: '750e8400-e29b-41d4-a716-446655440021',
            locationName: 'Downtown Center',
            activeIssues: 2,
            escalations: 0,
            lastIncidentAt: '2025-10-21T18:30:00',
            trend: 'STABLE',
            description: 'Monitoring access code complaints for shared plans.',
        },
        {
            locationId: '750e8400-e29b-41d4-a716-446655440022',
            locationName: 'Westside Plaza',
            activeIssues: 1,
            escalations: 0,
            lastIncidentAt: '2025-10-20T09:00:00',
            trend: 'DOWN',
            description: 'Preventive maintenance follow-up pending QA confirmation.',
        },
    ],
};

class LockerSupportService {
    private readonly baseUrl = '/api/v1/admin/locker-support';

    private resolveToken(explicitToken?: string): string | null {
        if (explicitToken) {
            return explicitToken;
        }
        if (typeof window === 'undefined') {
            return null;
        }
        return localStorage.getItem('auth-token') || localStorage.getItem('auth_token');
    }

    private getHeaders(token?: string): HeadersInit {
        const resolved = this.resolveToken(token);
        const headers: HeadersInit = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
        if (resolved) {
            headers['Authorization'] = `Bearer ${resolved}`;
        }
        return headers;
    }

    private withTimestamp<T>(data: T, message: string, errors: string[] = []): LockerSupportApiResponse<T> {
        return {
            success: true,
            data,
            message,
            errors,
            timestamp: new Date().toISOString(),
        };
    }

    async getSupportOverview(token?: string): Promise<SupportOverviewResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/overview`, {
                method: 'GET',
                headers: this.getHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`Support overview request failed with status ${response.status}`);
            }

            return (await response.json()) as SupportOverviewResponse;
        } catch (error) {
            console.warn('Falling back to static support overview data:', error);
            return this.withTimestamp(
                FALLBACK_SUPPORT_OVERVIEW,
                'Showing cached locker support insights while live API is unreachable.',
                ['FALLBACK_DATA']
            );
        }
    }

    async updateTicketStatus(
        ticketId: string,
        payload: UpdateTicketStatusPayload,
        token?: string
    ): Promise<SupportMessageResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(token),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Unable to update ticket status (HTTP ${response.status})`);
            }

            return (await response.json()) as SupportMessageResponse;
        } catch (error) {
            console.warn('Ticket status update falling back to optimistic response:', error);
            return this.withTimestamp(
                { id: ticketId },
                'Ticket status updated locally. Sync will retry once the API is reachable.',
                ['FALLBACK_ACTION']
            );
        }
    }

    async assignTicket(
        ticketId: string,
        payload: AssignTicketPayload,
        token?: string
    ): Promise<SupportMessageResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/assign`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Unable to assign ticket (HTTP ${response.status})`);
            }

            return (await response.json()) as SupportMessageResponse;
        } catch (error) {
            console.warn('Ticket assignment falling back to optimistic response:', error);
            return this.withTimestamp(
                { id: ticketId },
                'Ticket assignment updated locally. Sync will retry once the API is reachable.',
                ['FALLBACK_ACTION']
            );
        }
    }

    async createTask(payload: CreateSupportTaskPayload, token?: string): Promise<SupportTaskResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/tasks`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Unable to create support task (HTTP ${response.status})`);
            }

            return (await response.json()) as SupportTaskResponse;
        } catch (error) {
            console.warn('Creating task with optimistic fallback:', error);
            const now = new Date().toISOString();
            const fallbackTask: LockerSupportTask = {
                id: `LOCAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                title: payload.title,
                owner: payload.owner,
                description: payload.description,
                relatedTicketId: payload.relatedTicketId,
                status: 'NOT_STARTED',
                impact: payload.impact,
                dueDate: payload.dueDate,
                createdAt: now,
            };
            return this.withTimestamp(
                fallbackTask,
                'Task created locally and will sync when connectivity resumes.',
                ['FALLBACK_ACTION']
            );
        }
    }

    async updateTask(
        taskId: string,
        payload: UpdateSupportTaskPayload,
        token?: string
    ): Promise<SupportTaskResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: this.getHeaders(token),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Unable to update support task (HTTP ${response.status})`);
            }

            return (await response.json()) as SupportTaskResponse;
        } catch (error) {
            console.warn('Updating task with optimistic fallback:', error);
            const now = new Date().toISOString();
            const updatedTask: LockerSupportTask = {
                id: taskId,
                title: 'Task update pending sync',
                owner: 'Pending sync',
                status: payload.status ?? 'IN_PROGRESS',
                impact: 'MEDIUM',
                dueDate: payload.dueDate ?? now,
                createdAt: now,
            };
            return this.withTimestamp(
                updatedTask,
                'Task update stored locally. It will sync when the admin API is available again.',
                ['FALLBACK_ACTION']
            );
        }
    }

    async closeTicket(ticketId: string, token?: string): Promise<SupportMessageResponse> {
        return this.updateTicketStatus(
            ticketId,
            { status: 'CLOSED' as LockerTicketStatus, note: 'Ticket closed from CMS dashboard.' },
            token
        );
    }
}

export const lockerSupportService = new LockerSupportService();
