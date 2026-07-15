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
      const verified = await jwtVerify(token, JWT_SECRET);
      const payload = verified.payload as any;

      const role = payload.role;

      // Giới hạn quyền STAFF không được vào admin
      if (role === 'STAFF') {
        return new NextResponse('Forbidden: Staff cannot access admin portal', { status: 403 });
      }

      // Giới hạn quyền ADMIN không được vào Quản lý User
      if (role === 'ADMIN' && pathname.startsWith('/admin/users')) {
        return new NextResponse('Forbidden: Admin cannot manage users', { status: 403 });
      }

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
