import { NextResponse } from 'next/server';

const pincodeCache = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get('code') || '').trim();

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Valid 6-digit Indian pincode required.' },
        { status: 400 }
      );
    }

    // Check in-memory cache first for instant response
    if (pincodeCache.has(code)) {
      return NextResponse.json({ success: true, ...pincodeCache.get(code) });
    }

    // India Post Open API with 3.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Unable to fetch pincode details.' });
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
      const office = data[0].PostOffice[0];
      const city = office.District || office.Block || office.Name || '';
      const state = office.State || '';

      const result = { city, state };
      pincodeCache.set(code, result);

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ success: false, error: 'Pincode not found.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Auto-fetch failed.' });
  }
}
