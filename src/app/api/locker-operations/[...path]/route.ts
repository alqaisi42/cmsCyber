// src/app/api/v1/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://localhost:8050').replace(/\/$/, '');
const BACKEND_API_PREFIX = process.env.BACKEND_API_PREFIX ?? 'api';
const MAX_REDIRECTS = Number(process.env.LOCKER_API_PROXY_MAX_REDIRECTS ?? 3);

type SupportedMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function buildBackendUrl(path: string, searchParams?: string): string {
    const cleaned = path.replace(/^\/+/, '');
    const prefix = BACKEND_API_PREFIX.replace(/^\/+|\/+$/g, '');
    const fullPath = prefix ? `${prefix}/${cleaned}` : cleaned;
    const url = `${BACKEND_API_URL}/${fullPath}`;
    return searchParams ? `${url}?${searchParams}` : url;
}

function createHeaders(request: NextRequest, includeBody: boolean): HeadersInit {
    const headers: HeadersInit = {
        Accept: request.headers.get('accept') ?? 'application/json, */*',
    };
    if (includeBody) headers['Content-Type'] = request.headers.get('content-type') ?? 'application/json';
    const auth = request.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;
    return headers;
}

async function forwardResponse(response: Response): Promise<NextResponse> {
    const type = response.headers.get('content-type') ?? 'application/json';
    if (type.includes('application/json')) {
        try {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid backend JSON' }, { status: 500 });
        }
    }
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { 'Content-Type': type } });
}

async function executeBackendRequest(url: string, init: RequestInit & { method: SupportedMethod }, redirectsLeft: number): Promise<Response> {
    const res = await fetch(url, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400 && redirectsLeft > 0) {
        const location = res.headers.get('location');
        if (location) {
            return executeBackendRequest(location, init, redirectsLeft - 1);
        }
    }
    return res;
}

async function proxyRequest(
    request: NextRequest,
    params: { path?: string[] },
    method: SupportedMethod,
    includeBody: boolean
): Promise<NextResponse> {
    const segments = params.path ?? [];
    const path = segments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();

    if (!path) {
        return NextResponse.json({ success: false, message: 'Missing path' }, { status: 400 });
    }

    const url = buildBackendUrl(path, searchParams);
    const headers = createHeaders(request, includeBody);

    try {
        const body = includeBody ? JSON.stringify(await request.json().catch(() => ({}))) : undefined;
        const res = await executeBackendRequest(url, { method, headers, body, cache: 'no-store' }, MAX_REDIRECTS);
        return await forwardResponse(res);
    } catch (e) {
        return NextResponse.json(
            { success: false, message: `Failed to ${method} ${path}`, error: String(e) },
            { status: 502 }
        );
    }
}

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(request, params, 'GET', false);
}
export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(request, params, 'POST', true);
}
export async function PUT(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(request, params, 'PUT', true);
}
export async function PATCH(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(request, params, 'PATCH', true);
}
export async function DELETE(request: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(request, params, 'DELETE', false);
}
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
