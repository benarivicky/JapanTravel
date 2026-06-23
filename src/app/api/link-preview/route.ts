import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');

  if (!urlParam) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(urlParam);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json({ error: 'invalid protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // Google Maps links don't expose a useful OG image on a plain fetch, so for
  // them we look up a Google-curated place photo via the Places API instead.
  // Any failure here falls through to the generic OG scrape below.
  if (isGoogleMapsUrl(targetUrl)) {
    const place = await mapsPlacePreview(targetUrl);
    if (place) {
      return NextResponse.json(place, { headers: cacheHeaders() });
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JapanTravelPlanner/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) {
      return NextResponse.json({ domain: targetUrl.hostname }, { headers: cacheHeaders() });
    }

    // Read at most 50 KB — OG tags are always in <head>, early in the document.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let bytesRead = 0;
    if (reader) {
      while (bytesRead < 50 * 1024) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        bytesRead += value.length;
      }
      reader.cancel();
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));

    return NextResponse.json(
      {
        image:       extractMeta(html, ['og:image', 'twitter:image']),
        description: extractMeta(html, ['og:description', 'description']),
        siteName:    extractMeta(html, ['og:site_name']),
        domain:      targetUrl.hostname,
      },
      { headers: cacheHeaders() },
    );
  } catch {
    return NextResponse.json({ domain: targetUrl.hostname }, { headers: cacheHeaders() });
  }
}

function cacheHeaders() {
  return { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' };
}

function extractMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(':', '\\:');
    // <meta property="og:image" content="…"> or reversed attribute order
    const val =
      html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"'\\s][^"']*)["']`, 'i'))?.[1] ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"'\\s][^"']*)["'][^>]+property=["']${escaped}["']`, 'i'))?.[1] ||
      html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"'\\s][^"']*)["']`, 'i'))?.[1]  ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"'\\s][^"']*)["'][^>]+name=["']${name}["']`, 'i'))?.[1];
    if (val) return val;
  }
  return null;
}

// ── Google Maps place-photo lookup ─────────────────────────────────────────

const MAPS_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
]);

function isGoogleMapsUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (MAPS_HOSTS.has(host)) return true;
  // www.google.com/maps/…, google.co.jp/maps/…, etc.
  return /(^|\.)google\.[a-z.]+$/.test(host) && url.pathname.startsWith('/maps');
}

/**
 * Resolves a Google Maps URL to a Places photo preview, or null if no usable
 * photo is found / the API key is unconfigured / anything goes wrong.
 */
async function mapsPlacePreview(url: URL): Promise<{
  image: string;
  siteName: string | null;
  domain: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const query = await extractPlaceQuery(url);
    if (!query) return null;

    // Places API (New) — Text Search. Ask only for the fields we render.
    const searchRes = await fetchWithTimeout('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.photos',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1, languageCode: 'he' }),
    });
    if (!searchRes.ok) return null;

    const search = (await searchRes.json()) as {
      places?: { displayName?: { text?: string }; photos?: { name?: string }[] }[];
    };
    const place = search.places?.[0];
    const photoName = place?.photos?.[0]?.name;
    if (!photoName) return null;

    // Resolve the photo reference to a hosted image URL. skipHttpRedirect makes
    // the API return the URL as JSON (instead of redirecting to the bytes), so
    // the resulting googleusercontent URL we hand the browser carries no key.
    const photoRes = await fetchWithTimeout(
      `https://places.googleapis.com/v1/${photoName}/media` +
        `?maxHeightPx=400&maxWidthPx=800&skipHttpRedirect=true&key=${apiKey}`,
    );
    if (!photoRes.ok) return null;

    const photo = (await photoRes.json()) as { photoUri?: string };
    if (!photo.photoUri) return null;

    return {
      image: photo.photoUri,
      siteName: place?.displayName?.text ?? null,
      domain: url.hostname,
    };
  } catch {
    return null;
  }
}

/**
 * Derives a text query (place name or "lat,lng") from a Google Maps URL,
 * following one redirect hop for shortened maps.app.goo.gl / goo.gl links.
 */
async function extractPlaceQuery(url: URL): Promise<string | null> {
  let resolved = url;

  // Shortened links redirect to the full /maps/place/… URL.
  if (resolved.hostname === 'maps.app.goo.gl' || resolved.hostname === 'goo.gl') {
    const location = await followRedirect(resolved.toString());
    if (!location) return null;
    try {
      resolved = new URL(location);
    } catch {
      return null;
    }
  }

  // /maps/place/<NAME>/@lat,lng,...
  const placeMatch = resolved.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    const name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    if (name && !/^@/.test(name)) return name;
  }

  // ?q=… / ?query=… (Maps URLs API form). Ignore bare lat,lng-only queries —
  // Text Search needs a place name to return a meaningful photo.
  const q = resolved.searchParams.get('query') || resolved.searchParams.get('q');
  if (q) {
    const trimmed = q.trim();
    if (trimmed && !/^[-\d.]+,[-\d.\s]+$/.test(trimmed)) return trimmed;
  }

  return null;
}

async function followRedirect(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, { redirect: 'manual' });
    return res.headers.get('location');
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JapanTravelPlanner/1.0)', ...init.headers },
    });
  } finally {
    clearTimeout(timeout);
  }
}
