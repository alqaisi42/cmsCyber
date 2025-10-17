
// -----------------------------------------------------------------------------
// 7️⃣ Product Variants API Route
// File: src/app/api/v1/products/[id]/variants/route.ts
// -----------------------------------------------------------------------------

import {NextRequest, NextResponse} from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

        const response = await fetch(
            `${BACKEND_URL}/api/v1/products/${params.id}/variants`
        );

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: 'Variants not found' },
                { status: 404 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Product Variants API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
