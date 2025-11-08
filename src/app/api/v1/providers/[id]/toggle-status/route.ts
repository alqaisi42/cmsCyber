// -----------------------------------------------------------------------------
// Toggle Provider Status API Route
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

function createHeaders(request: NextRequest): HeadersInit {
    const headers: HeadersInit = {
        Accept: 'application/json',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    return headers;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/providers/${params.id}/toggle-status`, {
            method: 'PATCH',
            headers: createHeaders(request),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Toggle Provider Status Error:', errorText);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to toggle provider status',
                    error: errorText || undefined,
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Toggle Provider Status Exception:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
        );
    }
}
