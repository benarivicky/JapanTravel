'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { getTripDays } from '@/lib/database';
import type { TripDay } from '@/lib/types';
import {
  formatTripDate,
  getDayTitle,
  getDayHotel,
} from '@/lib/trip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
  BedDouble,
  ChevronLeft,
} from 'lucide-react';

export default function TripDayPage() {
  const router = useRouter();
  const params = useParams();
  const { tripId, loading: tripIdLoading } = useTripId();

  const [day, setDay] = useState<TripDay | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(0);
  const [previousDay, setPreviousDay] = useState<TripDay | null>(null);
  const [nextDay, setNextDay] = useState<TripDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const date = typeof params.date === 'string' ? params.date : '';

  useEffect(() => {
    if (!tripIdLoading && !tripId) {
      router.replace('/');
    }
  }, [tripId, tripIdLoading, router]);

  useEffect(() => {
    if (day) {
      const city = getDayTitle(day);
      document.title = `${city ? `${city} — ` : ''}${formatTripDate(day.date)} | טיול ליפן`;
    }
  }, [day]);

  useEffect(() => {
    if (tripId && date) {
      const fetchDay = async () => {
        try {
          setLoading(true);
          const days = await getTripDays(tripId);
          const index = days.findIndex((d) => d.date === date);

          if (index === -1) {
            notFound();
            return;
          }

          setDay(days[index]);
          setDayNumber(index + 1);
          setPreviousDay(index > 0 ? days[index - 1] : null);
          setNextDay(index < days.length - 1 ? days[index + 1] : null);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setLoading(false);
        }
      };
      fetchDay();
    } else if (!tripIdLoading && !date) {
      notFound();
    }
  }, [tripId, date, tripIdLoading]);

  if (loading || tripIdLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!day) {
    return notFound();
  }

  const formattedDate = formatTripDate(day.date);
  const city = getDayTitle(day);
  const hotel = getDayHotel(day);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky breadcrumb bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3" data-testid="breadcrumb-nav">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  {/* Hash makes the trip plan scroll to + highlight this day on return */}
                  <Link href={`/trip#${day.date}`} className="text-base">תוכנית הטיול</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-base">{formattedDate}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Return to this exact day within the main trip plan (scrolls to the card) */}
          <Button asChild variant="outline" className="h-11 px-3 sm:px-4 text-base gap-2 shrink-0">
            <Link href={`/trip#${day.date}`}>
              <ArrowRight className="h-5 w-5" />
              <span className="hidden sm:inline">חזרה לתוכנית</span>
            </Link>
          </Button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="overflow-hidden shadow-md">
          {/* Sun-red hero banner (logo palette) — matches activity page hero */}
          <div className="bg-gradient-to-l from-[#7e1418] to-[#b21f24] text-white px-6 sm:px-8 py-6 sm:py-8">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-sm font-bold bg-[#c99a5b] text-[#2b1d10] rounded-full px-3 py-1">
                יום {dayNumber}
              </span>
              <p className="text-base font-medium text-white/80 text-right">{formattedDate}</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-right text-white leading-tight mt-3">
              {city || formattedDate}
            </h1>
            {(city || hotel) && (
              <div className="flex justify-end flex-wrap gap-2 mt-4">
                {city && (
                  <span className="inline-flex items-center gap-1.5 text-base bg-white/15 text-white rounded-full px-3 py-1 border border-white/25">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {city}
                  </span>
                )}
                {hotel && (
                  <span className="inline-flex items-center gap-1.5 text-base bg-white/15 text-white rounded-full px-3 py-1 border border-white/25">
                    <BedDouble className="h-4 w-4 shrink-0" />
                    {hotel}
                  </span>
                )}
              </div>
            )}
          </div>

          <CardContent className="p-0">
            <h2 className="text-right text-xl font-bold text-foreground px-5 sm:px-6 pt-6 pb-2">
              סדר היום
            </h2>
            {/* Activities — each row is a 60px+ touch target leading to its detail */}
            {day.segments.map((segment, index) => (
              <div key={segment.id}>
                <Link
                  href={`/trip/${day.date}/${segment.timeSegmentNumeric}`}
                  className="flex items-center gap-3 min-h-[64px] px-5 sm:px-6 py-4 hover:bg-accent/50 active:bg-accent transition-colors border-r-4 border-transparent hover:border-[#c99a5b] focus:outline-none focus-visible:bg-accent/50"
                >
                  <ChevronLeft className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-right text-lg leading-snug">{segment.timeSegment}</h3>
                    <div
                      className="text-muted-foreground text-right text-base mt-1 leading-snug"
                      dangerouslySetInnerHTML={{ __html: segment.summary }}
                    />
                  </div>
                </Link>
                {index < day.segments.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>

          {/* Full-width prev/next DAY bar — 60px touch target */}
          <div className="border-t bg-muted px-4 sm:px-6 py-2 flex items-stretch">
            <div className="flex-1 flex justify-start">
              {nextDay && (
                <Button asChild variant="ghost" className="h-14 text-base font-medium text-primary hover:bg-accent gap-2">
                  <Link href={`/trip/${nextDay.date}`}>
                    היום הבא
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              {previousDay && (
                <Button asChild variant="ghost" className="h-14 text-base font-medium text-primary hover:bg-accent gap-2">
                  <Link href={`/trip/${previousDay.date}`}>
                    <ArrowRight className="h-5 w-5" />
                    היום הקודם
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
