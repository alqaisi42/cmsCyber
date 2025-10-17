
// -----------------------------------------------------------------------------
// 6️⃣ Product Images API Route
// File: src/app/api/v1/products/[id]/images/route.ts
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/products/${params.id}/images`, {
            headers: {
                Accept: 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');

            console.error('Product Images API Error Response:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    message: response.status === 404 ? 'Images not found' : 'Failed to fetch images',
                    error: errorText || undefined,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Product Images API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const payload = await request.json();
        const response = await fetch(`${BACKEND_URL}/api/v1/products/${params.id}/images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');

            console.error('Create Product Image API Error Response:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create product image',
                    error: errorText || undefined,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Create Product Image API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}