import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload, verifyToken } from '@/lib/auth';
import { NextURL } from "next/dist/server/web/next-url";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname: string = request.headers.get('host') || '';
  const rootDomain: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';

  const hostnameWithoutPort: string = hostname.split(':')[0];
  
  const isSubdomain: boolean = hostnameWithoutPort !== rootDomain &&
    hostnameWithoutPort !== `www.${rootDomain}` &&
    hostnameWithoutPort.endsWith(`.${rootDomain}`);
  
  const subdomain: string = isSubdomain
    ? hostnameWithoutPort.replace(`.${rootDomain}`, '')
    : '';

  const token: string | undefined = request.cookies.get('auth-token')?.value;
  const payload: JWTPayload | null = token ? await verifyToken(token) : null;

  if (pathname.startsWith('/login') && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/logout')) {
    const response: NextResponse = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  if (pathname.startsWith('/create_marathon') &&
    (!payload || !['organizer', 'admin'].includes(payload.role))) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  if (isSubdomain) {
    const url: NextURL = request.nextUrl.clone();
    url.pathname = `/marathons/${subdomain}${pathname}`;

    const requestHeaders = new Headers(request.headers);
    if (payload) {
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-role', payload.role);
    }

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  if (!payload) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
