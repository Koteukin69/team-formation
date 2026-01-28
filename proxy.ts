import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || ''
const secret = new TextEncoder().encode(JWT_SECRET)

// Routes that require authentication
const protectedRoutes = [
  '/marathons/new',
  '/profile',
]

// Routes that should redirect to home if already authenticated
const authRoutes = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value

  let isAuthenticated = false

  if (token) {
    try {
      await jwtVerify(token, secret)
      isAuthenticated = true
    } catch {
      // Token invalid or expired
    }
  }

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Check auth routes
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check marathon-specific routes that require authentication
  const marathonProtectedPattern = /^\/[^/]+\/(my-profile|my-team|my-applications|my-invitations|admin|participants\/[a-f0-9]{24}$)/
  if (marathonProtectedPattern.test(pathname) && !isAuthenticated) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
