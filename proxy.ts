import { NextRequest, NextResponse } from 'next/server';
import {createToken, verifyToken} from '@/lib/auth';
import { NextURL } from "next/dist/server/web/next-url";
import {JWTPayload, User} from '@/lib/types';
import {Collection, ObjectId} from "mongodb";
import {collections} from "@/lib/db/collections";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const rootDomain: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';

  const subdomain = hostname.split('.')[0];
  const isSubdomain = subdomain !== rootDomain.split('.')[0] &&
    subdomain !== 'www';

  const token: string | undefined = request.cookies.get('auth-token')?.value;
  const payload: JWTPayload | null = token ? await verifyToken(token) : null;

  if (pathname.startsWith('/login') && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/logout')) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  if (pathname.startsWith('/refresh-session') && payload) {
    const response = NextResponse.redirect(new URL('/', request.url));
    const usersCollection: Collection<User> = await collections.users();
    const user = (await usersCollection.findOne({_id: new ObjectId(payload.userId)})) as User;

    if (!user) {
      return NextResponse.redirect(new URL('/logout', request.url));
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user?.email,
      telegram_id: user?.telegram_id,
      role: user.role
    });

    response.cookies.set('auth-token', token);
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
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
    }

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  if (!payload) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};