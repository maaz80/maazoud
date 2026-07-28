import { NextResponse } from 'next/server';

export async function GET(request) {
  // Read Vercel IP-country header, default to 'IN' for local development
  const country = request.headers.get('x-vercel-ip-country') || 'IN';
  return NextResponse.json({ country });
}
