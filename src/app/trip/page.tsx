'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { useAuth } from '@/hooks/use-auth';
import { getTripPlans, getTripCustomerName } from '@/lib/database';
import type { TripDay } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, Terminal, ArrowRight, BedDouble, MapPin, Camera } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function TripPage() {
  const router = useRouter();
  const { tripId, loading: tripIdLoading, clearTripId } = useTripId();
  const { isAdmin, loading: authLoading } = useAuth();
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // Refs: one per card, keyed by date
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!tripIdLoading && !tripId) {
      router.replace('/');
    }
  }, [tripId, tripIdLoading, router]);

  useEffect(() => {
    if (tripId) {
      const fetchTripData = async () => {
        setLoading(true);
        setError(null);
        try {
          const [segments, name] = await Promise.all([
            getTripPlans(tripId),
            getTripCustomerName(tripId),
          ]);

          setCustomerName(name);

          if (segments.length === 0) {
            setError(`לא נמצאו נתוני טיול עבור מזהה "${tripId}". אנא ודא שהמסמך קיים ב-Firestore בנתיב "tripPlans/${tripId}" ומכיל מערך תקין בשם "dailyItinerary".`);
            setTripDays([]);
          } else {
            const groupedByDate = segments.reduce((acc, segment) => {
              const date = segment.date;
              if (!acc[date]) acc[date] = [];
              acc[date].push(segment);
              return acc;
            }, {} as Record<string, typeof segments>);

            const days: TripDay[] = Object.entries(groupedByDate)
              .map(([date, segs]) => ({
                date,
                segments: segs.sort((a, b) => a.timeSegmentNumeric - b.timeSegmentNumeric),
              }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setTripDays(days);
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(`אירעה שגיאה בטעינת הטיול. ייתכן שיש בעיית הרשאות ב-Firestore או שהנתונים אינם תקינים. שגיאה: ${msg}`);
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchTripData();
    }
  }, [tripId]);

  // Scroll the targeted date card into the center of the Radix ScrollArea viewport.
  // scrollIntoView() doesn't work inside Radix ScrollArea because it uses a custom
  // scroll container — we must find the viewport element and set scrollLeft manually.
  const scrollToDate = useCallback((date: string) => {
    const card = cardRefs.current[date];
    if (!card) return;

    // The Radix ScrollArea viewport is the nearest scrollable ancestor and carries
    // a data-radix-scroll-area-viewport attribute.
    const viewport = card.closest<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      // getBoundingClientRect gives positions relative to the visual viewport,
      // so this works regardless of DOM nesting inside Radix ScrollArea.
      const cardRect = card.getBoundingClientRect();
      const vpRect = viewport.getBoundingClientRect();
      const targetLeft =
        viewport.scrollLeft + cardRect.left - vpRect.left - viewport.clientWidth / 2 + card.offsetWidth / 2;
      viewport.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }

    setActiveDate(date);
    setTimeout(() => setActiveDate(null), 3000);
  }, []);

  // Detect URL hash on load and on hash-change (browser back/forward).
  useEffect(() => {
    if (tripDays.length === 0) return;

    const run = () => {
      const date = window.location.hash.slice(1); // strip leading #
      if (date) scrollToDate(date);
    };

    // requestAnimationFrame inside setTimeout: first waits for React paint, then
    // waits for the browser layout pass so offsetLeft values are stable.
    const timer = setTimeout(() => requestAnimationFrame(run), 50);
    window.addEventListener('hashchange', run);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', run);
    };
  }, [tripDays, scrollToDate]);

  const formattedDates = useMemo(() => {
    return tripDays.map(day => {
      const date = new Date(day.date);
      return new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(date);
    });
  }, [tripDays]);

  const handleLogout = () => {
    clearTripId();
    router.push('/');
  };

  if (tripIdLoading || loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-right text-foreground">
          תוכנית הטיול{customerName ? ` - ${customerName}` : ''}
        </h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/trip/identify" className="flex items-center gap-2">
              <Camera />
              צילום
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="secondary">
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout}>
            <ArrowRight />
            התנתק
          </Button>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive" dir="rtl">
          <Terminal className="h-4 w-4" />
          <AlertTitle>שגיאה בטעינת הטיול</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
          <div className="flex w-max space-x-4 space-x-reverse p-4">
            {tripDays.map((day, index) => {
              const isActive = activeDate === day.date;
              return (
                <div
                  key={day.date}
                  ref={el => { cardRefs.current[day.date] = el; }}
                  className="w-[350px] flex flex-col"
                >
                  <Card
                    className={[
                      'flex flex-col h-full transition-all duration-500',
                      isActive
                        ? 'ring-4 ring-offset-2 ring-indigo-500 shadow-xl shadow-indigo-300/60 scale-[1.05] bg-indigo-50/40'
                        : 'shadow-sm',
                    ].join(' ')}
                  >
                    <CardHeader>
                      <CardTitle className="text-right text-xl font-semibold">
                        {formattedDates[index]}
                      </CardTitle>
                      {(day.segments[0]?.city || day.segments[0]?.hotelsDetails) && (
                        <div className="text-muted-foreground text-right text-sm mt-1 flex justify-end items-center flex-wrap gap-x-4 gap-y-1">
                          {day.segments[0].city && (
                            <div className="flex items-center gap-1">
                              <span>{day.segments[0].city}</span>
                              <MapPin className="h-4 w-4" />
                            </div>
                          )}
                          {day.segments[0].hotelsDetails && (
                            <div className="flex items-center gap-1">
                              <span>{day.segments[0].hotelsDetails}</span>
                              <BedDouble className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                      <div className="flex-grow">
                        {day.segments.map((segment, segIndex) => (
                          <div key={segment.id}>
                            <Link
                              href={`/trip/${segment.date}/${segment.timeSegmentNumeric}`}
                              onClick={() => history.replaceState(null, '', `#${day.date}`)}
                              passHref
                            >
                              <div className="block p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                                <h4 className="font-bold text-right">{segment.timeSegment}</h4>
                                <div
                                  className="text-muted-foreground text-right whitespace-normal"
                                  dangerouslySetInnerHTML={{ __html: segment.summary }}
                                />
                              </div>
                            </Link>
                            {segIndex < day.segments.length - 1 && <Separator />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
