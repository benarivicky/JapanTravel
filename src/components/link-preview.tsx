'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

interface PreviewData {
  image?: string | null;
  /** True when the link itself is an image (Drive file, direct .jpg/.png …) —
   *  rendered as a full image preview rather than a thumbnail row. */
  isImage?: boolean;
  description?: string | null;
  siteName?: string | null;
  domain?: string;
}

/** Remote images are served through the local cache so repeat visitors don't
 *  re-download them and hotlink-hostile hosts (Drive) can't break previews. */
function cachedSrc(url: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

interface LinkPreviewProps {
  href: string;
  title: string;
}

export function LinkPreview({ href, title }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setPreview(data); })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [href]);

  const hasThumbnail = preview?.image && !imgError;
  const faviconSrc = preview?.domain
    ? `https://www.google.com/s2/favicons?domain=${preview.domain}&sz=32`
    : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 hover:shadow-md active:bg-accent/40 transition-all"
    >
      {/* Image preview — full-height when the link IS an image (e.g. תמונת האיזור),
          thumbnail band for pages with an OG/place photo */}
      {hasThumbnail && (
        <div
          className={`w-full bg-muted overflow-hidden ${
            preview.isImage ? 'h-56 sm:h-72' : 'h-36 sm:h-44'
          }`}
        >
          <img
            src={cachedSrc(preview.image!)}
            alt={preview.isImage ? title : ''}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Info row */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 min-h-[64px]">
        {/* Arrow icon on the left (RTL: visual left = document right) */}
        <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />

        {/* Text block — right-aligned for RTL */}
        <div className="flex flex-col items-end gap-1 min-w-0 flex-1">
          <span className="font-semibold text-base text-link text-right leading-snug line-clamp-2">
            {title}
          </span>
          {preview?.domain ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {faviconSrc ? (
                <img
                  src={faviconSrc}
                  alt=""
                  className="h-4 w-4 rounded-sm"
                  onError={e => { (e.currentTarget as HTMLImageElement).replaceWith(document.createElement('span')); }}
                />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {preview.domain}
            </span>
          ) : (
            /* skeleton while loading */
            <span className="h-4 w-32 rounded bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </a>
  );
}
