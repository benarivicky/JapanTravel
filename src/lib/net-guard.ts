import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/** True for IPv4/IPv6 addresses in loopback, private, link-local, unique-local,
 *  or cloud-metadata (169.254.169.254) ranges — anything not routable on the
 *  public internet that a server-side proxy must not be tricked into reaching. */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||               // link-local + metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||     // CGNAT
      a >= 224                                  // multicast / reserved
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === '::1' || lower === '::' ||
    lower.startsWith('fe80') ||                 // link-local
    lower.startsWith('fc') || lower.startsWith('fd') || // unique-local
    lower.startsWith('::ffff:')                 // IPv4-mapped
  );
}

/** Resolves a hostname and returns false if it maps to any private/reserved IP
 *  (or fails to resolve). Literal IPs are checked directly. */
export async function isPublicHost(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (isIP(host)) return !isPrivateIp(host);
  try {
    const addrs = await lookup(host, { all: true });
    return addrs.length > 0 && addrs.every(a => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/** Like fetch() but follows redirects manually, re-validating every hop against
 *  isPublicHost so a public URL cannot 3xx-bounce us onto an internal address.
 *  Returns null if a hop targets a blocked host/protocol or the chain is too long.
 *  Shared by every server-side proxy route so the SSRF guard is applied uniformly. */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  maxHops = 5,
): Promise<Response | null> {
  let current = url;
  for (let hop = 0; hop < maxHops; hop++) {
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
