// -----------------------------------------------------------------------------
// Provider Categories API Route
// File: src/app/api/v1/providers/[id]/categories/route.ts
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

async function forwardResponse(response: Response, notFoundMessage = 'Categories not found') {
    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Provider categories API error:', errorText);
        return NextResponse.json(
            {
                success: false,
                message: response.status === 404 ? notFoundMessage : 'Provider category request failed',
                error: errorText || undefined,
            },
            { status: response.status },
        );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const url = new URL(request.url);
        const activeOnly = url.searchParams.get('activeOnly');
        const query = activeOnly ? `?activeOnly=${activeOnly}` : '';

        const response = await fetch(`${BACKEND_URL}/api/v1/providers/${params.id}/categories${query}`, {
            headers: createHeaders(request),
            cache: 'no-store',
        });

        return await forwardResponse(response);
    } catch (error) {
        console.error('Provider categories GET error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const payload = await request.json();
        const response = await fetch(`${BACKEND_URL}/api/v1/providers/${params.id}/categories`, {
            method: 'POST',
            headers: createHeaders(request),
            body: JSON.stringify(payload),
            cache: 'no-store',
        });

        return await forwardResponse(response, 'Unable to create category');
    } catch (error) {
        console.error('Provider categories POST error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
