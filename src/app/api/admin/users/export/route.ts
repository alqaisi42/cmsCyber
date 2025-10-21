import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.ADMIN_API_BASE_URL ?? 'http://148.230.111.245:32080';

function buildBackendUrl(request: Request) {
    const requestUrl = new URL(request.url);
    const backendUrl = new URL('/api/v1/admin/users/export', BACKEND_BASE_URL);

    requestUrl.searchParams.forEach((value, key) => {
        backendUrl.searchParams.append(key, value);
    });

    return backendUrl;
}

export async function GET(request: Request) {
    const backendUrl = buildBackendUrl(request);
    const authorization = request.headers.get('authorization');

    try {
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(authorization ? { Authorization: authorization } : {}),
            },
            cache: 'no-store',
        });

        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

        const text = await response.text();
        return new NextResponse(text, { status: response.status });
    } catch (error) {
        console.error('Failed to proxy admin user export:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to export users',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            },
            { status: 500 },
        );
    }
}
