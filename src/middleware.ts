import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

async function verifySession(session: string | undefined) {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

const protectedRoutes = ['/dashboard', '/products', '/categories', '/orders', '/restock', '/activity'];
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => path === route);

  const sessionCookie = request.cookies.get('session')?.value;
  const session = await verifySession(sessionCookie);

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth routes with active session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect root to dashboard or login
  if (path === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/dashboard/:path*', '/products/:path*', '/categories/:path*', '/orders/:path*', '/restock/:path*', '/activity/:path*'],
};
