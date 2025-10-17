// =============================================================================
// Product Variants API Route - FIXED
// File: src/app/api/v1/products/[id]/variants/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

/**
 * GET /api/v1/products/[id]/variants
 * Fetches all variants for a product
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const url = `${BACKEND_URL}/api/v1/products/${id}/variants`;

        console.log('🔵 Fetching product variants:', url);

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
                    message: response.status === 404 ? 'Variants not found' : 'Failed to fetch variants',
                    error: errorText,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('✅ Variants data received:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Product Variants API Error:', error);

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
 * POST /api/v1/products/[id]/variants
 * Creates a new variant for a product
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const url = `${BACKEND_URL}/api/v1/products/${id}/variants`;

        console.log('🔵 Creating product variant:', url);

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
                    message: 'Failed to create variant',
                    error: errorText,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('✅ Variant created successfully');

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Create Variant API Error:', error);

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