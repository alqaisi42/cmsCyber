
// -----------------------------------------------------------------------------
// 4️⃣ Products API Route
// File: src/app/api/v1/products/route.ts
// -----------------------------------------------------------------------------

import {NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

        const response = await fetch(
            `${BACKEND_URL}/api/v1/products/search?${searchParams.toString()}`
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
        console.error('Products API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}