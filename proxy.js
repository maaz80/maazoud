import { NextResponse } from 'next/server';

export function proxy(request) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Redirect www.maazoud.in -> maazoud.in (SEO Best Practice)
  if (host.startsWith('www.maazoud.in') || host.startsWith('www.localhost')) {
    const newHost = host.replace(/^www\./, '');
    url.host = newHost;
    
    // Use 301 Permanent Redirect (great for passing link juice / authority to main domain)
    return NextResponse.redirect(url, 301);
  }

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
