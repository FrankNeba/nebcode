import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Always protected top-level sections
  const strictlyProtectedPrefixes = ['/mysql-lab', '/editor', '/dashboard', '/admin'];
  const isStrictlyProtected = strictlyProtectedPrefixes.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // For /courses: course catalog (/courses) and syllabus overview (/courses/[slug]) are public.
  // But taking lessons or taking an exam requires login.
  const isCourseActionProtected = (
    pathname.includes('/lesson/') ||
    pathname.includes('/lessons/') ||
    pathname.includes('/exam') ||
    pathname.startsWith('/mcq/')
  );

  const isProtected = isStrictlyProtected || isCourseActionProtected;

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
    '/courses/:path*',
    '/mcq/:path*',
    '/dashboard', '/dashboard/:path*',
    '/admin', '/admin/:path*',
  ],
};


