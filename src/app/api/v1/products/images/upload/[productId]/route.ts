import {NextRequest, NextResponse} from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

export async function POST(request: NextRequest, { params }) {
    try {
        const backendUrl = `${BACKEND_URL}/api/v1/products/images/upload/${params.productId}`;

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": request.headers.get("content-type")!,
                "Accept": "application/json"
            },
            body: request.body,
            duplex: "half"
        } as any);

        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: "Backend error", error: text },
                { status: response.status }
            );
        }

        return NextResponse.json(JSON.parse(text));
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Internal server error", detail: String(err) },
            { status: 500 }
        );
    }
}

