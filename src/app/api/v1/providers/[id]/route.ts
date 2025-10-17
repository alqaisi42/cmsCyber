// -----------------------------------------------------------------------------
// 2️⃣ Provider by ID API Route
// File: src/app/api/v1/providers/[id]/route.ts
// -----------------------------------------------------------------------------

import {NextRequest, NextResponse} from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
            const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

        const response = await fetch(`${BACKEND_URL}/api/v1/providers/${params.id}`);

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: 'Provider not found' },
                { status: 404 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Provider by ID API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
