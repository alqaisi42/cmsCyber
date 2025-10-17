import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://148.230.111.245:32080';

export async function POST(
    request: NextRequest,
    { params }: { params: { productId: string } }
) {
    try {
        const formData = await request.formData();

        const response = await fetch(
            `${BACKEND_URL}/api/v1/products/images/upload/${params.productId}`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');

            console.error('Upload Product Images API Error Response:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to upload product images',
                    error: errorText || undefined,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Upload Product Images API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
