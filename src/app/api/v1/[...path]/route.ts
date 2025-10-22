// src/app/api/v1/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ==========================================
// CONFIGURATION
// ==========================================
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

// ==========================================
// TYPES
// ==========================================
interface ProxyConfig {
    method: string;
    path: string;
    searchParams?: string;
    body?: any;
}

interface ErrorResponse {
    success: false;
    message: string;
    error?: string;
    timestamp: string;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Build the complete backend URL
 */
function buildBackendUrl(path: string, searchParams?: string): string {
    const url = `${BACKEND_URL}/api/v1/${path}`;
    return searchParams ? `${url}?${searchParams}` : url;
}

/**
 * Create standard headers
 */
function createHeaders(request: NextRequest, includeBody: boolean): HeadersInit {
    const headers: HeadersInit = {};

    const acceptHeader = request.headers.get('accept');
    if (acceptHeader) {
        headers['Accept'] = acceptHeader;
    } else {
        headers['Accept'] = 'application/json, */*';
    }

    if (includeBody) {
        const contentType = request.headers.get('content-type');
        headers['Content-Type'] = contentType ?? 'application/json';
    }

    // Forward authorization if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }

    return headers;
}

/**
 * Log request details (development only)
 */
function logRequest(config: ProxyConfig): void {
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 [${config.method}] ${buildBackendUrl(config.path, config.searchParams)}`);
        if (config.body) {
            console.log('📦 Body:', JSON.stringify(config.body, null, 2));
        }
    }
}

/**
 * Create error response
 */
function createErrorResponse(
    message: string,
    error?: unknown,
    status: number = 500
): NextResponse<ErrorResponse> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ Proxy Error: ${message}`, errorMessage);

    return NextResponse.json(
        {
            success: false,
            message,
            error: errorMessage,
            timestamp: new Date().toISOString(),
        },
        { status }
    );
}

/**
 * Handle non-JSON responses
 */
async function handleResponse(response: Response): Promise<NextResponse> {
    const contentType = response.headers.get('content-type');

    try {
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        } else {
            const text = await response.text();
            return new NextResponse(text, {
                status: response.status,
                headers: { 'Content-Type': contentType || 'text/plain' },
            });
        }
    } catch (error) {
        return createErrorResponse('Failed to parse response', error, response.status);
    }
}

/**
 * Core proxy function - handles all HTTP methods
 */
async function proxyRequest(
    request: NextRequest,
    params: { path: string[] },
    method: string,
    includeBody: boolean = false
): Promise<NextResponse> {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();

    const config: ProxyConfig = {
        method,
        path,
        searchParams,
    };

    // Parse body for methods that support it
    if (includeBody) {
        try {
            config.body = await request.json();
        } catch (error) {
            return createErrorResponse('Invalid JSON body', error, 400);
        }
    }

    logRequest(config);

    try {
        const url = buildBackendUrl(path, searchParams);
        const headers = createHeaders(request, includeBody);

        const response = await fetch(url, {
            method,
            headers,
            body: config.body ? JSON.stringify(config.body) : undefined,
            cache: 'no-store', // Prevent caching issues
        });

        return await handleResponse(response);
    } catch (error) {
        return createErrorResponse(`Failed to ${method} ${path}`, error);
    }
}

// ==========================================
// HTTP METHOD HANDLERS
// ==========================================

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
): Promise<NextResponse> {
    return proxyRequest(request, params, 'GET');
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
): Promise<NextResponse> {
    return proxyRequest(request, params, 'POST', true);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
): Promise<NextResponse> {
    return proxyRequest(request, params, 'PUT', true);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { path: string[] } }
): Promise<NextResponse> {
    return proxyRequest(request, params, 'PATCH', true);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
): Promise<NextResponse> {
    return proxyRequest(request, params, 'DELETE');
}

export async function OPTIONS(
    request: NextRequest
): Promise<NextResponse> {
    // Handle CORS preflight
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}