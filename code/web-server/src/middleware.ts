import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_local_kiosk');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(`${request.nextUrl.origin}/kios/admin/login`);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      // Token is invalid or expired
      const response = NextResponse.redirect(`${request.nextUrl.origin}/kios/admin/login`);
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
