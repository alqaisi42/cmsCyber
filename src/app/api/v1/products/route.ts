// =============================================================================
// Products Search API Route - NEW
// File: src/app/api/v1/products/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8050';

/**
 * GET /api/v1/products
 * Search/list all products with filters and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Build query string from all params
        const queryString = searchParams.toString();
        const url = `${BACKEND_URL}/api/v1/products/search${queryString ? `?${queryString}` : ''}`;

        console.log('🔵 Searching products:', url);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to fetch products',
                    error: errorText,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('✅ Products data received');

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Products Search API Error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/v1/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const url = `${BACKEND_URL}/api/v1/products`;

        console.log('🔵 Creating product:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create product',
                    error: errorText,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('✅ Product created successfully');

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Create Product API Error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
