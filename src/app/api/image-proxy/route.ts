import { type NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isPublicHost, safeFetch } from '@/lib/net-guard';

/**
 * Serves remote images through a local disk cache.
 *
 * Why: link thumbnails (Google Drive, place photos, OG images) are re-fetched
 * by every visitor and some hosts throttle or block hotlinking. First request
 * downloads the image once to disk; every request after that is served locally.
 *
 * Cache location: IMAGE_CACHE_DIR, or <os tmp>/jt-image-cache. In the hardened
 * container the root FS is read-only and /tmp is a tmpfs mount, so the default
 * works there without extra configuration.
 */

// Resolved lazily (not at module scope) so Next's build-time file tracing
// doesn't try to bundle the temp directory into the standalone output.
function cacheDir(): string {
  return process.env.IMAGE_CACHE_DIR || path.join(tmpdir(), 'jt-image-cache');
}
const MAX_BYTES = 8 * 1024 * 1024; // refuse images larger than 8 MB
const FETCH_TIMEOUT_MS = 10_000;

const BROWSER_CACHE = {
  'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
};

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
    if (!['http:', 'https:'].includes(target.protocol)) {
      return NextResponse.json({ error: 'invalid protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  const key = createHash('sha256').update(target.toString()).digest('hex');
  const bodyPath = path.join(cacheDir(), key);
  const metaPath = `${bodyPath}.meta`;

  // 1. Cache hit — serve from disk.
  try {
    const [body, meta] = await Promise.all([readFile(bodyPath), readFile(metaPath, 'utf8')]);
    return new NextResponse(new Uint8Array(body), {
      headers: { 'Content-Type': meta, 'X-Image-Cache': 'hit', ...BROWSER_CACHE },
    });
  } catch {
    /* miss — download below */
  }

  // 2. Cache miss — download once (SSRF-guarded), store, serve.
  if (!(await isPublicHost(target.hostname))) {
    return NextResponse.json({ error: 'blocked host' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    // safeFetch follows redirects manually, re-validating every hop against the
    // SSRF guard — a public URL cannot 3xx-bounce us onto an internal address.
    let res: Response | null;
    try {
      res = await safeFetch(target.toString(), {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JapanTravelPlanner/1.0)' },
      });
    } finally {
      clearTimeout(timeout);
    }

    // null = a redirect hop targeted a blocked host, or the chain was too long.
    if (!res) {
      return NextResponse.json({ error: 'blocked host' }, { status: 400 });
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok || !contentType.startsWith('image/')) {
      res.body?.cancel();
      return NextResponse.json({ error: 'not an image' }, { status: 502 });
    }

    // Reject early when the host declares an oversized body...
    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BYTES) {
      res.body?.cancel();
      return NextResponse.json({ error: 'image too large' }, { status: 502 });
    }

    // ...then enforce the cap while streaming so a lying/absent Content-Length
    // can never make us buffer an unbounded body into memory (OOM DoS).
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.length;
        if (total > MAX_BYTES) {
          await reader.cancel();
          return NextResponse.json({ error: 'image too large' }, { status: 502 });
        }
        chunks.push(value);
      }
    }
    const buf = Buffer.concat(chunks);
    if (buf.length === 0) {
      return NextResponse.json({ error: 'not an image' }, { status: 502 });
    }

    // Write-through: tmp file + rename so concurrent requests never read a
    // half-written entry. Cache failures must not break image serving.
    try {
      await mkdir(cacheDir(), { recursive: true });
      const tmp = `${bodyPath}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, buf);
      await rename(tmp, bodyPath);
      await writeFile(metaPath, contentType);
    } catch {
      /* disk full / read-only — still serve the fetched bytes */
    }

    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': contentType, 'X-Image-Cache': 'miss', ...BROWSER_CACHE },
    });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }
}
