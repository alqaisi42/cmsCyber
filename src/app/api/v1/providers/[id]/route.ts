// -----------------------------------------------------------------------------
// 2️⃣ Provider by ID API Route
// File: src/app/api/v1/providers/[id]/route.ts
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/providers/${params.id}`, {
            headers: {
                Accept: 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');

            console.error('Provider by ID API Error Response:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    message: response.status === 404 ? 'Provider not found' : 'Failed to fetch provider',
                    error: errorText || undefined,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Provider by ID API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
