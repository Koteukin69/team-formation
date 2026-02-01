import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('auth-token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (pathname.startsWith('/login') && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/logout')) {
    const response:NextResponse = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  const requestHeaders = new Headers(request.headers);

  if (pathname.startsWith('/create_marathon') && (!payload || !['organizer', 'admin'].includes(payload.role))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!payload) return NextResponse.next();

  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};