'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { getTripPlans } from '@/lib/database';
import type { TripSegment } from '@/lib/types';
import { formatTripDate } from '@/lib/trip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { LinkPreview } from '@/components/link-preview';

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

  const formattedDate = formatTripDate(segment.date);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky breadcrumb bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3" data-testid="breadcrumb-nav">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  {/* Hash makes the trip plan scroll to + highlight this day on return */}
                  <Link href={`/trip#${segment.date}`} className="text-base">תוכנית הטיול</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/trip/${segment.date}`} className="text-base">{formattedDate}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-base">{segment.timeSegment}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="overflow-hidden shadow-md">
          {/* Deep navy hero banner — matches day card header */}
          <div className="bg-gradient-to-l from-slate-700 to-blue-900 text-white px-6 sm:px-8 py-6 sm:py-8">
            <p className="text-base font-medium text-blue-200 text-right mb-2">{formattedDate}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-right text-white leading-tight">{segment.timeSegment}</h1>
            <div
              className="text-blue-100 text-right text-lg mt-3 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: segment.summary }}
            />
          </div>

          <CardContent className="px-6 sm:px-8 pt-7 pb-4">
            <div
              className="prose prose-lg prose-slate dark:prose-invert max-w-none text-right leading-relaxed"
              dangerouslySetInnerHTML={{ __html: segment.detailedContent }}
            />

            {segment.externalLinks && segment.externalLinks.length > 0 && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-lg font-semibold text-right text-slate-800 mb-4">קישורים שימושיים</h4>
                <ul className="list-none p-0 space-y-4">
                  {segment.externalLinks.map((link, index) => (
                    link.linkLink && link.linkTitle && (
                      <li key={index}>
                        <LinkPreview href={link.linkLink} title={link.linkTitle} />
                      </li>
                    )
                  ))}
                </ul>
              </div>
            )}
          </CardContent>

          {/* Full-width prev/next bar — 60px touch target */}
          <div className="border-t bg-slate-50 px-4 sm:px-6 py-2 flex items-stretch">
            <div className="flex-1 flex justify-start">
              {nextSegment && (
                <Button asChild variant="ghost" className="h-14 text-base font-medium text-blue-800 hover:bg-blue-50 gap-2">
                  <Link href={`/trip/${nextSegment.date}/${nextSegment.timeSegmentNumeric}`}>
                    הפעילות הבאה
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              {previousSegment && (
                <Button asChild variant="ghost" className="h-14 text-base font-medium text-blue-800 hover:bg-blue-50 gap-2">
                  <Link href={`/trip/${previousSegment.date}/${previousSegment.timeSegmentNumeric}`}>
                    <ArrowRight className="h-5 w-5" />
                    הפעילות הקודמת
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
