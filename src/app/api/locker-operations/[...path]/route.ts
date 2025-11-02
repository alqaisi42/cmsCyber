// src/app/api/locker-operations/[...path]/route.ts
// Generic proxy that forwards locker management requests to the backend API.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://148.230.111.245:32080').replace(/\/$/, '');
const BACKEND_API_PREFIX = process.env.BACKEND_API_PREFIX ?? 'api';
const MAX_REDIRECTS = Number(process.env.LOCKER_API_PROXY_MAX_REDIRECTS ?? 3);

type SupportedMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ProxyContext {
    method: SupportedMethod;
    path: string;
    searchParams?: string;
    body?: unknown;
}

function buildBackendUrl(path: string, searchParams?: string): string {
    const cleanedPath = path.replace(/^\/+/, '');
    const prefix = BACKEND_API_PREFIX?.trim().replace(/^\/+|\/+$/g, '');
    const fullPath = prefix ? `${prefix}/${cleanedPath}` : cleanedPath;
    const url = `${BACKEND_API_URL}/${fullPath}`;
    return searchParams ? `${url}?${searchParams}` : url;
}

function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

function resolveRedirectLocation(location: string): string {
    if (!location) {
        return '';
    }

    if (isAbsoluteUrl(location)) {
        return location;
    }

    const normalizedLocation = location.replace(/^\/+/, '');
    return `${BACKEND_API_URL}/${normalizedLocation}`;
}

function createHeaders(request: NextRequest, includeBody: boolean): HeadersInit {
    const headers: HeadersInit = {
        Accept: request.headers.get('accept') ?? 'application/json, */*',
    };

    if (includeBody) {
        headers['Content-Type'] = request.headers.get('content-type') ?? 'application/json';
    }

    const auth = request.headers.get('authorization');
    if (auth) {
        headers['Authorization'] = auth;
    }

    return headers;
}

function copyResponseHeaders(source: Response, target: NextResponse): void {
    const hopByHopHeaders = new Set([
        'connection',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'te',
        'trailers',
        'transfer-encoding',
        'upgrade',
    ]);

    source.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (hopByHopHeaders.has(lowerKey)) {
            return;
        }

        if (lowerKey === 'set-cookie') {
            const headerWithCookies = source.headers as Headers & {
                getSetCookie?: () => string[];
            };
            const cookies = headerWithCookies.getSetCookie?.();

            if (cookies && cookies.length) {
                cookies.forEach((cookie) => target.headers.append('Set-Cookie', cookie));
            } else if (value) {
                target.headers.append('Set-Cookie', value);
            }
            return;
        }

        target.headers.set(key, value);
    });
}

async function forwardResponse(response: Response): Promise<NextResponse> {
    if (response.status === 204 || response.status === 205) {
        const emptyResponse = new NextResponse(null, { status: response.status });
        copyResponseHeaders(response, emptyResponse);
        return emptyResponse;
    }

    const contentType = response.headers.get('content-type') ?? 'application/json';

    if (contentType.includes('application/json')) {
        try {
            const data = await response.json();
            const jsonResponse = NextResponse.json(data, { status: response.status });
            copyResponseHeaders(response, jsonResponse);
            return jsonResponse;
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to parse backend JSON response',
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            );
        }
    }

    const text = await response.text();
    const textResponse = new NextResponse(text, {
        status: response.status,
        headers: { 'Content-Type': contentType },
    });
    copyResponseHeaders(response, textResponse);
    return textResponse;
}

async function executeBackendRequest(url: string, init: RequestInit & { method: SupportedMethod }, redirectsLeft: number): Promise<Response> {
    const response = await fetch(url, { ...init, redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
        if (redirectsLeft <= 0) {
            return response;
        }

        const locationHeader = response.headers.get('location');
        if (!locationHeader) {
            return response;
        }

        const redirectUrl = resolveRedirectLocation(locationHeader);
        if (!redirectUrl) {
            return response;
        }

        const nextInit: RequestInit & { method: SupportedMethod } = { ...init };

        if (response.status === 303 && init.method !== 'GET') {
            nextInit.method = 'GET';
            nextInit.body = undefined;
        }

        return executeBackendRequest(redirectUrl, nextInit, redirectsLeft - 1);
    }

    return response;
}

async function proxyRequest(
    request: NextRequest,
    params: { path?: string[] },
    method: SupportedMethod,
    includeBody: boolean
): Promise<NextResponse> {
    const segments = params.path ?? [];
    const path = segments.join('/');

    if (!path) {
        return NextResponse.json(
            {
                success: false,
                message: 'Missing locker operations endpoint path',
                timestamp: new Date().toISOString(),
            },
            { status: 400 }
        );
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const context: ProxyContext = { method, path, searchParams };

    if (includeBody) {
        try {
            context.body = await request.json();
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid JSON body received by proxy',
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString(),
                },
                { status: 400 }
            );
        }
    }

    const targetUrl = buildBackendUrl(context.path, context.searchParams);
    const headers = createHeaders(request, includeBody);

    try {
        const response = await executeBackendRequest(
            targetUrl,
            {
                method: context.method,
                headers,
                body: includeBody && context.body !== undefined ? JSON.stringify(context.body) : undefined,
                cache: 'no-store',
            },
            Number.isFinite(MAX_REDIRECTS) && MAX_REDIRECTS >= 0 ? MAX_REDIRECTS : 3
        );

        return await forwardResponse(response);
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: `Failed to ${method} ${context.path}`,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString(),
            },
            { status: 502 }
        );
    }
}

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }): Promise<NextResponse> {
    return proxyRequest(request, params, 'GET', false);
}

export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }): Promise<NextResponse> {
    return proxyRequest(request, params, 'POST', true);
}

export async function PUT(request: NextRequest, { params }: { params: { path?: string[] } }): Promise<NextResponse> {
    return proxyRequest(request, params, 'PUT', true);
}

export async function PATCH(request: NextRequest, { params }: { params: { path?: string[] } }): Promise<NextResponse> {
    return proxyRequest(request, params, 'PATCH', true);
}

export async function DELETE(request: NextRequest, { params }: { params: { path?: string[] } }): Promise<NextResponse> {
    return proxyRequest(request, params, 'DELETE', false);
}

export async function OPTIONS(): Promise<NextResponse> {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
