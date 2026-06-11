'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { getTripPlans } from '@/lib/database';
import type { TripSegment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
      <div className="mb-6" data-testid="breadcrumb-nav">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/trip">תוכנית הטיול</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/trip#${segment.date}`}>{formattedDate}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{segment.timeSegment}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="overflow-hidden shadow-md">
        {/* Hero banner */}
        <div className="bg-gradient-to-l from-blue-50 to-indigo-100 px-6 py-5 border-b">
          <p className="text-sm font-medium text-indigo-500 text-right mb-1">{formattedDate}</p>
          <h1 className="text-3xl font-bold text-right text-indigo-900">{segment.timeSegment}</h1>
          <div
            className="text-indigo-700/80 text-right mt-2"
            dangerouslySetInnerHTML={{ __html: segment.summary }}
          />
        </div>

        <CardContent className="pt-6">
          <div
            className="prose prose-blue dark:prose-invert max-w-none text-right"
            dangerouslySetInnerHTML={{ __html: segment.detailedContent }}
          />

          {segment.externalLinks && segment.externalLinks.length > 0 && (
            <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <h4 className="text-base font-semibold text-right text-indigo-800 mb-3">קישורים שימושיים</h4>
              <ul className="list-none p-0 space-y-2">
                {segment.externalLinks.map((link, index) => (
                  link.linkLink && link.linkTitle && (
                    <li key={index}>
                      <a
                        href={link.linkLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-end gap-2 rounded-lg bg-white border border-indigo-100 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                      >
                        {link.linkTitle}
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        {/* Full-width prev/next bar */}
        <div className="border-t bg-muted/30 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-start">
            {nextSegment && (
              <Button asChild variant="ghost" className="text-indigo-700 hover:bg-indigo-50">
                <Link href={`/trip/${nextSegment.date}/${nextSegment.timeSegmentNumeric}`} className="flex items-center gap-2">
                  הפעילות הבאה
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {previousSegment && (
              <Button asChild variant="ghost" className="text-indigo-700 hover:bg-indigo-50">
                <Link href={`/trip/${previousSegment.date}/${previousSegment.timeSegmentNumeric}`} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  הפעילות הקודמת
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}
