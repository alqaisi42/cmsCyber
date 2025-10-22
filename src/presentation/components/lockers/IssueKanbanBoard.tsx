// src/presentation/components/lockers/IssueKanbanBoard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    User,
    Calendar,
    AlertTriangle,
} from 'lucide-react';
// Import IssueSeverity along with other types
import { LockerIssue, LockerIssueStatus } from '../../../core/entities/lockers';
import { cn } from '../../../shared/utils/cn';

// ==========================================
// TYPES
// ==========================================

interface KanbanColumn {
    id: LockerIssueStatus;
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface IssueKanbanBoardProps {
    issues: LockerIssue[];
    onIssueClick: (issue: LockerIssue) => void;
    onStatusChange: (issueId: string, newStatus: LockerIssueStatus) => Promise<void>;
    loading?: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================

const COLUMNS: KanbanColumn[] = [
    {
        id: 'OPEN',
        title: 'Open',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
    },
    {
        id: 'IN_PROGRESS',
        title: 'In Progress',
        icon: <Clock className="w-4 h-4" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    {
        id: 'RESOLVED',
        title: 'Resolved',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
    },
    {
        id: 'CLOSED',
        title: 'Closed',
        icon: <XCircle className="w-4 h-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
    },
];

// Updated to use IssueSeverity type
const SEVERITY_COLORS: Record<IssueSeverity, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

// ==========================================
// COMPONENT
// ==========================================

export function IssueKanbanBoard({
                                     issues,
                                     onIssueClick,
                                     onStatusChange,
                                     loading = false,
                                 }: IssueKanbanBoardProps) {
    const [columns, setColumns] = useState<Record<LockerIssueStatus, LockerIssue[]>>({
        OPEN: [],
        IN_PROGRESS: [],
        RESOLVED: [],
        CLOSED: [],
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Organize issues by status
    useEffect(() => {
        const organized: Record<LockerIssueStatus, LockerIssue[]> = {
            OPEN: [],
            IN_PROGRESS: [],
            RESOLVED: [],
            CLOSED: [],
        };

        issues.forEach((issue) => {
            organized[issue.status].push(issue);
        });

        setColumns(organized);
    }, [issues]);

    // Handle drag end
    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // No movement
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const sourceStatus = source.droppableId as LockerIssueStatus;
        const destStatus = destination.droppableId as LockerIssueStatus;

        // Optimistic update
        const sourceColumn = [...columns[sourceStatus]];
        const destColumn = sourceStatus === destStatus ? sourceColumn : [...columns[destStatus]];
        const [movedIssue] = sourceColumn.splice(source.index, 1);

        destColumn.splice(destination.index, 0, {
            ...movedIssue,
            status: destStatus,
        });

        setColumns({
            ...columns,
            [sourceStatus]: sourceColumn,
            [destStatus]: destColumn,
        });

        // API call
        setIsUpdating(true);
        try {
            await onStatusChange(draggableId, destStatus);
        } catch (error) {
            // Rollback on error
            setColumns({
                ...columns,
            });
            console.error('Failed to update issue status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading issues...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {isUpdating && (
                <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-blue-600 animate-pulse" />
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="flex flex-col">
                            {/* Column Header */}
                            <div
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 rounded-t-lg border-2',
                                    column.bgColor,
                                    column.borderColor
                                )}
                            >
                                <span className={column.color}>{column.icon}</span>
                                <h3 className={cn('font-semibold', column.color)}>
                                    {column.title}
                                </h3>
                                <span
                                    className={cn(
                                        'ml-auto text-xs font-medium px-2 py-1 rounded-full',
                                        column.bgColor,
                                        column.color
                                    )}
                                >
                                    {columns[column.id].length}
                                </span>
                            </div>

                            {/* Droppable Column */}
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            'flex-1 p-3 space-y-3 rounded-b-lg border-2 border-t-0 min-h-[400px]',
                                            column.borderColor,
                                            snapshot.isDraggingOver ? column.bgColor : 'bg-gray-50'
                                        )}
                                    >
                                        {columns[column.id].map((issue, index) => (
                                            <Draggable
                                                key={issue.id}
                                                draggableId={issue.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <IssueCard
                                                        issue={issue}
                                                        onClick={() => onIssueClick(issue)}
                                                        isDragging={snapshot.isDragging}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        draggableProps={provided.draggableProps}
                                                        innerRef={provided.innerRef}
                                                    />
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {columns[column.id].length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                                <AlertCircle className="w-8 h-8 mb-2" />
                                                <p className="text-sm">No {column.title.toLowerCase()} issues</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}

// ==========================================
// ISSUE CARD COMPONENT
// ==========================================

interface IssueCardProps {
    issue: LockerIssue;
    onClick: () => void;
    isDragging: boolean;
    dragHandleProps: any;
    draggableProps: any;
    innerRef: any;
}

function IssueCard({
                       issue,
                       onClick,
                       isDragging,
                       dragHandleProps,
                       draggableProps,
                       innerRef,
                   }: IssueCardProps) {
    return (
        <div
            ref={innerRef}
            {...draggableProps}
            {...dragHandleProps}
            onClick={onClick}
            className={cn(
                'bg-white rounded-lg border-2 p-4 cursor-pointer transition-all',
                'hover:shadow-md hover:border-blue-300',
                isDragging ? 'shadow-lg rotate-2 border-blue-400' : 'border-gray-200'
            )}
        >
            {/* Severity Badge */}
            <div className="flex items-start justify-between mb-3">
                <span
                    className={cn(
                        'text-xs font-medium px-2 py-1 rounded-md border',
                        SEVERITY_COLORS[issue.severity]
                    )}
                >
                    {issue.severity}
                </span>
                {issue.severity === 'CRITICAL' && (
                    <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                )}
            </div>

            {/* Issue Title */}
            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{issue.title}</h4>

            {/* Issue Type */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                {issue.issueType}
            </p>

            {/* Locker Code */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <div className="px-2 py-1 bg-gray-100 rounded font-mono">
                    {issue.lockerCode}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {issue.assignedTo ? (
                        <>
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{issue.assignedTo}</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                    )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Reported Date */}
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <Calendar className="w-3 h-3" />
                <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

export default IssueKanbanBoard;
export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';