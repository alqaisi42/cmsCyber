// -----------------------------------------------------------------------------
// File: src/app/api/v1/providers/search/route.ts
// Handles GET /api/v1/providers/search → forwards to backend
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

function createHeaders(request: NextRequest): HeadersInit {
    const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    return headers;
}

async function forwardResponse(response: Response) {
    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Provider Search API Error:', errorText);
        return NextResponse.json(
            {
                success: false,
                message: 'Provider search failed',
                error: errorText || undefined,
            },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest) {
    try {
        // Forward query params (page, size, keyword, etc.)
        const url = new URL(request.url);
        const query = url.searchParams.toString();

        const response = await fetch(`${BACKEND_URL}/api/v1/providers/search?${query}`, {
            method: 'GET',
            headers: createHeaders(request),
            cache: 'no-store',
        });

        return await forwardResponse(response);
    } catch (error) {
        console.error('Provider Search Proxy Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
