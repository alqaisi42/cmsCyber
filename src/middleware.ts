// STEP 1: Create middleware to handle authentication
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = new URL(request.url);

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/'];

    // If user is not authenticated and trying to access protected route
    if (!token && !publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is authenticated and trying to access login page
    if (token && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
