import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/sessions', '/exam', '/camera', '/onboarding'];
const AUTH_ONLY_PREFIXES = ['/login', '/register'];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('pl_token');
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const isAuthRoute = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

    if (isProtected && !token) {
        return NextResponse.redirect(
            new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
        );
    }

    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|patient|api).*)'],
};
