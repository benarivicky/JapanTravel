'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { getTripPlans } from '@/lib/database';
import type { TripSegment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';

export default function TripSegmentPage() {
  const router = useRouter();
  const params = useParams();
  const { tripId, loading: tripIdLoading } = useTripId();

  const [segment, setSegment] = useState<TripSegment | null>(null);
  const [nextSegment, setNextSegment] = useState<TripSegment | null>(null);
  const [previousSegment, setPreviousSegment] = useState<TripSegment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const date = typeof params.date === 'string' ? params.date : '';
  const segmentSlug = typeof params.segment === 'string' ? params.segment : '';
  const segmentNumeric = parseInt(segmentSlug, 10);

  useEffect(() => {
    if (!tripIdLoading && !tripId) {
      router.replace('/');
    }
  }, [tripId, tripIdLoading, router]);

  useEffect(() => {
    // Set document title when segment is loaded
    if (segment) {
      const cleanSummary = segment.summary.replace(/<[^>]*>?/gm, '');
      document.title = `${segment.timeSegment} - ${cleanSummary} | טיול ליפן`;
    }
  }, [segment]);

  useEffect(() => {
    if (tripId && date && !isNaN(segmentNumeric)) {
      const fetchSegment = async () => {
        try {
          setLoading(true);
          const allSegments = await getTripPlans(tripId);
          const dailySegments = allSegments
            .filter((s) => s.date === date)
            .sort((a, b) => a.timeSegmentNumeric - b.timeSegmentNumeric);

          const currentIndex = dailySegments.findIndex((s) => s.timeSegmentNumeric === segmentNumeric);

          if (currentIndex === -1) {
            notFound();
            return;
          }

          const currentSegment = dailySegments[currentIndex];
          setSegment(currentSegment);

          const next = currentIndex < dailySegments.length - 1 ? dailySegments[currentIndex + 1] : null;
          setNextSegment(next);

          const previous = currentIndex > 0 ? dailySegments[currentIndex - 1] : null;
          setPreviousSegment(previous);

        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSegment();
    } else if (!tripIdLoading && (isNaN(segmentNumeric) || !date)) {
      notFound();
    }
  }, [tripId, date, segmentNumeric, tripIdLoading]);


  if (loading || tripIdLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    // You could create a more specific error component
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!segment) {
    // This will be caught by the notFound() in useEffect, but as a fallback
    return notFound();
  }

  const formattedDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(segment.date));

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <Button asChild variant="ghost">
          <Link href="/trip" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה לתוכנית הטיול
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-right">
            {segment.timeSegment} - {formattedDate}
          </CardTitle>
          <div className="text-muted-foreground text-right text-lg" dangerouslySetInnerHTML={{ __html: segment.summary }} />
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-blue dark:prose-invert max-w-none text-right"
            dangerouslySetInnerHTML={{ __html: segment.detailedContent }}
          />

          {segment.externalLinks && segment.externalLinks.length > 0 && (
            <div className="mt-8 text-right space-y-2">
              <h4 className="text-xl font-bold">קישורים שימושיים</h4>
              <ul className="list-none p-0">
                {segment.externalLinks.map((link, index) => (
                  link.linkLink && link.linkTitle && (
                    <li key={index} className="mt-1">
                      <Button asChild variant="link" className="p-0 h-auto">
                        <a href={link.linkLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg text-link">
                          {link.linkTitle}
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </Button>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-between">
            {previousSegment && (
              <Button asChild variant="outline">
                <Link href={`/trip/${previousSegment.date}/${previousSegment.timeSegmentNumeric}`} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  הפעילות הקודמת
                </Link>
              </Button>
            )}
            {nextSegment && (
              <Button asChild variant="outline">
                <Link href={`/trip/${nextSegment.date}/${nextSegment.timeSegmentNumeric}`} className="flex items-center gap-2">
                  הפעילות הבאה
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </main>
  );
}
