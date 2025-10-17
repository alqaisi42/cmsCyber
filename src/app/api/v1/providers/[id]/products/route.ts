// -----------------------------------------------------------------------------
// 3️⃣ Provider Products API Route
// File: src/app/api/v1/providers/[id]/products/route.ts
// -----------------------------------------------------------------------------

import {NextRequest, NextResponse} from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '0';
        const size = searchParams.get('size') || '20';
        const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

        const response = await fetch(
            `${BACKEND_URL}/api/v1/providers/${params.id}/products?page=${page}&size=${size}`
        );

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: 'Failed to fetch products' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Provider Products API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
