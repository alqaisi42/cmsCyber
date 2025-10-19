// src/app/api/locker-dashboard/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = params.userId;

        // Validate userId
        if (!userId || isNaN(Number(userId))) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid user ID',
                    errors: ['User ID must be a valid number'],
                    data: null,
                    timestamp: new Date().toISOString()
                },
                { status: 400 }
            );
        }

        // Fetch from backend API
        const response = await fetch(
            `${BACKEND_API_URL}/api/v1/locker-dashboard/user/${userId}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // Forward any authentication headers if needed
                    ...(request.headers.get('authorization') && {
                        'Authorization': request.headers.get('authorization') as string
                    })
                },
            }
        );

        // Get the response data
        const data = await response.json();

        // If backend returns an error
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // Success response
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching locker dashboard:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch locker dashboard',
                errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
                data: null,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}