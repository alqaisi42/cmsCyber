// src/core/entities/locker-support.ts
// Domain models describing locker support tickets, operational tasks and issue digests.

export type LockerTicketStatus =
    | 'NEW'
    | 'ACKNOWLEDGED'
    | 'IN_PROGRESS'
    | 'WAITING_ON_CUSTOMER'
    | 'WAITING_ON_PROVIDER'
    | 'RESOLVED'
    | 'CLOSED';

export type LockerTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type LockerTicketChannel = 'PORTAL' | 'PHONE' | 'EMAIL' | 'MOBILE_APP';

export interface LockerSupportTimelineEvent {
    id: string;
    occurredAt: string;
    author: string;
    summary: string;
    type: 'NOTE' | 'STATUS_CHANGE' | 'ESCALATION' | 'RESOLUTION';
}

export interface LockerSupportTicket {
    id: string;
    subscriptionId: string;
    lockerCode: string;
    subject: string;
    description: string;
    status: LockerTicketStatus;
    priority: LockerTicketPriority;
    channel: LockerTicketChannel;
    createdAt: string;
    updatedAt: string;
    reportedBy: string;
    customerEmail?: string;
    assignedTo?: string;
    slaBreaches?: number;
    nextActionDueAt?: string;
    tags?: string[];
    timeline?: LockerSupportTimelineEvent[];
}

export interface LockerIssueDigest {
    locationId: string;
    locationName: string;
    activeIssues: number;
    escalations: number;
    lastIncidentAt?: string;
    trend: 'UP' | 'STABLE' | 'DOWN';
    description?: string;
}

export type LockerTaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
export type LockerTaskImpact = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LockerSupportTask {
    id: string;
    title: string;
    owner: string;
    description?: string;
    relatedTicketId?: string;
    status: LockerTaskStatus;
    impact: LockerTaskImpact;
    dueDate: string;
    createdAt: string;
}

export interface LockerSupportSummary {
    openTickets: number;
    breachedTickets: number;
    avgFirstResponseMinutes: number;
    avgResolutionHours: number;
    todaysHandovers: number;
    satisfactionScore?: number;
}

export interface LockerSupportOverview {
    summary: LockerSupportSummary;
    tickets: LockerSupportTicket[];
    tasks: LockerSupportTask[];
    issueDigest: LockerIssueDigest[];
}

export interface LockerSupportApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors: string[];
    timestamp: string;
}

export interface UpdateTicketStatusPayload {
    status: LockerTicketStatus;
    note?: string;
}

export interface AssignTicketPayload {
    assignee: string;
    note?: string;
}

export interface CreateSupportTaskPayload {
    title: string;
    owner: string;
    dueDate: string;
    impact: LockerTaskImpact;
    description?: string;
    relatedTicketId?: string;
}

export interface UpdateSupportTaskPayload {
    status?: LockerTaskStatus;
    dueDate?: string;
    note?: string;
}
