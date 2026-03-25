import { NextResponse } from 'next/server';

const MANIFEST_URL =
  process.env.MANIFEST_URL ||
  'https://github.com/TheZackPack/TZP-client/releases/latest/download/manifest.json';

let cachedManifest: unknown = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function GET() {
  try {
    const now = Date.now();
    if (cachedManifest && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedManifest);
    }

    const response = await fetch(MANIFEST_URL);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch manifest' }, { status: 502 });
    }

    cachedManifest = await response.json();
    cacheTimestamp = now;
    return NextResponse.json(cachedManifest);
  } catch (err) {
    console.error('Manifest fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
