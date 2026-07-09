import { NextResponse } from 'next/server';

export function proxy(request) {
  // Domain redirects are handled at Vercel's infrastructure level
  // (Settings → Domains). No app-level redirect needed.
  // Vercel config: maazoud.in → 308 → www.maazoud.in (primary)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo, and other public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|xml|txt)).*)',
  ],
};
