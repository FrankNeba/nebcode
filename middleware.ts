import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ['/mysql-lab', '/editor', '/courses', '/dashboard'];

  // Check if the current path is a protected path
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    // Redirect to login page if no token is found
    const loginUrl = new URL('/auth/login', request.url);
    // Optional: add a redirect parameter to return after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/mysql-lab/:path*', '/editor/:path*', '/courses/:path*', '/dashboard/:path*'],
};
