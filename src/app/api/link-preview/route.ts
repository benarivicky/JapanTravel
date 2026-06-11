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
