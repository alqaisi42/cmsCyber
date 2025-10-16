import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.ADMIN_API_BASE_URL ?? 'http://148.230.111.245:32080';

function buildBackendUrl(userId: string) {
    return new URL(`/api/v1/admin/users/${userId}`, BACKEND_BASE_URL);
}

async function forwardRequest(request: Request, userId: string) {
    const backendUrl = buildBackendUrl(userId);

    const init: RequestInit = {
        method: request.method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
    }

    const response = await fetch(backendUrl, init);
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, { status: response.status });
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
    try {
        return await forwardRequest(request, params.userId);
    } catch (error) {
        console.error('Failed to proxy admin user update:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update user',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            },
            { status: 500 },
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
    try {
        return await forwardRequest(request, params.userId);
    } catch (error) {
        console.error('Failed to proxy admin user delete:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to delete user',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            },
            { status: 500 },
        );
    }
}
