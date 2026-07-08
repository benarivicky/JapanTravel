import { type NextRequest, NextResponse } from 'next/server';
import { isPublicHost } from '@/lib/net-guard';

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

  // SSRF guard: refuse hostnames that resolve to private/reserved space so this
  // proxy can't be pointed at internal services or the cloud metadata endpoint.
  if (!(await isPublicHost(targetUrl.hostname))) {
    return NextResponse.json({ error: 'blocked host' }, { status: 400 });
  }

  // 1. The link IS an image (Google Drive file, direct .jpg/.png, …) — preview
  //    the image itself.
  const direct = directImageUrl(targetUrl);
  if (direct) {
    return NextResponse.json(
      { image: direct, isImage: true, domain: targetUrl.hostname },
      { headers: cacheHeaders() },
    );
  }

  // 2. Google Maps place OR route. Maps links don't expose a useful OG image on
  //    a plain fetch, so we look up a Google-curated photo via the Places API
  //    (route links → photo of the destination). If no photo is found we fall
  //    back to a bare domain row — never a map screenshot.
  if (isGoogleMapsUrl(targetUrl)) {
    const query = await extractPlaceQuery(targetUrl);
    const place = query ? await placePhoto(query) : null;
    return NextResponse.json(
      place ? { ...place, domain: targetUrl.hostname } : { domain: targetUrl.hostname },
      { headers: cacheHeaders() },
    );
  }

  // 3. Regular web page — scrape OG/Twitter tags. If the page exposes no social
  //    image, fall back to a Google-curated place photo looked up from the
  //    page's name (works for attraction/business pages; otherwise just the
  //    favicon row the client already renders).
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetchNoInternalRedirect(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JapanTravelPlanner/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res || !res.ok || !res.headers.get('content-type')?.includes('text/html')) {
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

    const description = extractMeta(html, ['og:description', 'description']);
    const siteName    = extractMeta(html, ['og:site_name']);
    let   image       = extractMeta(html, ['og:image', 'twitter:image']);

    // Fallback: no social image → try a place photo from the page's name.
    if (!image) {
      const name = pageName(html, siteName, targetUrl);
      const place = name ? await placePhoto(name) : null;
      if (place) image = place.image;
    }

    return NextResponse.json(
      { image: image ?? null, description, siteName, domain: targetUrl.hostname },
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

/** A best-effort place/business name for a page: og:site_name, og:title, or the
 *  first segment of <title> (sites usually append " | Brand" / " - Brand"). */
function pageName(html: string, siteName: string | null, url: URL): string | null {
  const ogTitle = extractMeta(html, ['og:title']);
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const raw = siteName || ogTitle || title;
  if (!raw) return null;
  // Drop a trailing " | Site", " - Site", " – Site", " — Site" suffix.
  const name = raw.split(/\s[|\-–—]\s/)[0].trim();
  // Ignore junk like a lone hostname or empty string.
  if (!name || name.toLowerCase() === url.hostname.toLowerCase()) return null;
  return name;
}

// ── Image links ─────────────────────────────────────────────────────────────

/**
 * If the URL points directly at an image (a shared Google Drive file, or a
 * plain .jpg/.png/… URL), returns a directly-renderable image URL. Otherwise null.
 */
function directImageUrl(url: URL): string | null {
  const host = url.hostname.toLowerCase();

  // Google Drive / Docs file → public thumbnail endpoint (no auth needed for
  // files shared "anyone with the link"). Handles /file/d/<id>/ and ?id=<id>.
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const id =
      url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ||
      url.pathname.match(/\/d\/([^/]+)/)?.[1] ||
      url.searchParams.get('id');
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  // Plain image URL by extension.
  if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(url.pathname)) {
    return url.toString();
  }

  return null;
}

// ── Google Places photo lookup (shared by Maps links and page fallback) ──────

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
 * Looks up a Google-curated place photo for a free-text query (place name).
 * Returns { image, siteName } or null if no photo / no API key / on error.
 */
async function placePhoto(query: string): Promise<{ image: string; siteName: string | null } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
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

    return { image: photo.photoUri, siteName: place?.displayName?.text ?? null };
  } catch {
    return null;
  }
}

/**
 * Derives a text query from a Google Maps URL — a place name, or the
 * destination of a directions/route link — following the redirect chain for
 * shortened maps.app.goo.gl / goo.gl links.
 */
async function extractPlaceQuery(url: URL): Promise<string | null> {
  let resolved = url;

  // Shortened links redirect to the full /maps/… URL.
  if (resolved.hostname === 'maps.app.goo.gl' || resolved.hostname === 'goo.gl') {
    const full = await resolveRedirect(resolved.toString());
    if (!full) return null;
    try {
      resolved = new URL(full);
    } catch {
      return null;
    }
  }

  // Directions / route: /maps/dir/<origin>/<destination>/… — preview the
  // destination (the place you're travelling to).
  if (resolved.pathname.includes('/maps/dir/') || resolved.searchParams.get('destination')) {
    const dest = routeDestination(resolved);
    if (dest) return dest;
  }

  // /maps/place/<NAME>/@lat,lng,...
  const placeMatch = resolved.pathname.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const name = cleanQuery(placeMatch[1]);
    if (name) return name;
  }

  // ?q=… / ?query=… (Maps URLs API form). Ignore bare lat,lng-only queries —
  // Text Search needs a place name to return a meaningful photo.
  const q = resolved.searchParams.get('query') || resolved.searchParams.get('q');
  if (q) {
    const trimmed = cleanQuery(q);
    if (trimmed && !isLatLng(trimmed)) return trimmed;
  }

  return null;
}

/** Extracts the destination place name from a /maps/dir/ or ?destination= URL. */
function routeDestination(url: URL): string | null {
  const param = url.searchParams.get('destination');
  if (param) {
    const cleaned = cleanQuery(param);
    if (cleaned && !isLatLng(cleaned)) return cleaned;
  }

  const dirMatch = url.pathname.match(/\/maps\/dir\/(.+)/);
  if (dirMatch) {
    // Segments between origin and the trailing @coords / data= blob.
    const segments = dirMatch[1]
      .split('/')
      .filter(s => s && !s.startsWith('@') && !s.startsWith('data=') && s !== '');
    for (let i = segments.length - 1; i >= 0; i--) {
      const cleaned = cleanQuery(segments[i]);
      if (cleaned && !isLatLng(cleaned)) return cleaned;
    }
  }
  return null;
}

function cleanQuery(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
  } catch {
    return raw.replace(/\+/g, ' ').trim();
  }
}

function isLatLng(s: string): boolean {
  return /^[-\d.]+\s*,\s*[-\d.]+$/.test(s);
}

/**
 * Follows the redirect chain of a shortened URL to its final destination.
 * Tries the cheap one-hop Location header first, then a full follow.
 */
async function resolveRedirect(url: string): Promise<string | null> {
  try {
    const head = await fetchWithTimeout(url, { redirect: 'manual' });
    const location = head.headers.get('location');
    if (location) return location;
  } catch {
    /* fall through to full follow */
  }
  try {
    const res = await fetchWithTimeout(url, { redirect: 'follow' });
    res.body?.cancel();
    if (res.url && res.url !== url) return res.url;
  } catch {
    /* ignore */
  }
  return null;
}

/** Like fetch() but follows redirects manually, re-validating every hop against
 *  isPublicHost so a public URL cannot 3xx-bounce us onto an internal address.
 *  Returns null if a hop targets a blocked host or the chain is too long. */
async function fetchNoInternalRedirect(url: string, init: RequestInit = {}): Promise<Response | null> {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    if (!['http:', 'https:'].includes(u.protocol) || !(await isPublicHost(u.hostname))) {
      return null;
    }
    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      res.body?.cancel();
      if (!loc) return res;
      current = new URL(loc, current).toString();
      continue;
    }
    return res;
  }
  return null;
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
