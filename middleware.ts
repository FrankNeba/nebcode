import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ['/mysql-lab', '/editor', '/courses', '/dashboard'];

  // Check if the current path starts with any of the protected paths
  const isProtected = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/mysql-lab', '/mysql-lab/:path*',
    '/editor', '/editor/:path*',
    '/courses', '/courses/:path*',
    '/dashboard', '/dashboard/:path*',
  ],
};
