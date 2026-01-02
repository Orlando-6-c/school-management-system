import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

export async function middleware(request: NextRequest) {
    const session = await getSession();

    // 1. Admin Routes (SuperAdmin only)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!session.isSuperAdmin) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. School Routes (SchoolAdmin only for now, eventually other roles)
    if (request.nextUrl.pathname.startsWith('/school')) {
        if (!session.userId) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. Login Route (Redirect if already authenticated)
    if (request.nextUrl.pathname === '/login') {
        if (session.userId) {
            if (session.isSuperAdmin) {
                return NextResponse.redirect(new URL('/admin', request.url));
            } else if (session.role === 'SchoolAdmin') {
                return NextResponse.redirect(new URL('/school', request.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/school/:path*', '/dashboard/:path*', '/login'],
};
