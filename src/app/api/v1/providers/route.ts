// -----------------------------------------------------------------------------
// 1️⃣ Providers API Route
// File: src/app/api/v1/providers/route.ts
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/providers`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: 'Failed to fetch providers' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Provider API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
