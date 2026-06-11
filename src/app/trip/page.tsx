'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { useAuth } from '@/hooks/use-auth';
import { getTripPlans, getTripCustomerName } from '@/lib/database';
import type { TripDay } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Grid layout scrolls naturally — scrollIntoView works without any Radix workaround.
  const scrollToDate = useCallback((date: string) => {
    const card = cardRefs.current[date];
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveDate(date);
    setTimeout(() => setActiveDate(null), 3000);
  }, []);

  useEffect(() => {
    if (tripDays.length === 0) return;

    const run = () => {
      const date = window.location.hash.slice(1);
      if (date) scrollToDate(date);
    };

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-right text-foreground leading-tight">
            תוכנית הטיול{customerName ? ` — ${customerName}` : ''}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <Button asChild variant="outline" className="h-11 px-4 text-base gap-2">
              <Link href="/trip/identify">
                <Camera className="h-5 w-5" />
                <span className="hidden sm:inline">צילום</span>
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="secondary" className="h-11 px-4 text-base">
                <Link href="/admin">Admin</Link>
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="h-11 px-4 text-base gap-2">
              <ArrowRight className="h-5 w-5" />
              <span className="hidden sm:inline">התנתק</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error ? (
          <Alert variant="destructive" dir="rtl">
            <Terminal className="h-5 w-5" />
            <AlertTitle>שגיאה בטעינת הטיול</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          /* Responsive grid: 1 col phone → 2 col tablet → 3 col desktop.
             Cards fill equal width at every breakpoint ("averaged" tiles). */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {tripDays.map((day, index) => {
              const isActive = activeDate === day.date;
              return (
                <div
                  key={day.date}
                  ref={el => { cardRefs.current[day.date] = el; }}
                >
                  <Card
                    className={[
                      'flex flex-col h-full transition-all duration-500 overflow-hidden',
                      isActive
                        ? 'ring-4 ring-offset-2 ring-indigo-500 shadow-2xl shadow-indigo-400/40 scale-[1.02]'
                        : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5',
                    ].join(' ')}
                  >
                    {/* Deep navy gradient header — premium, high-contrast */}
                    <CardHeader className="bg-gradient-to-l from-slate-700 to-blue-900 text-white pb-4 rounded-t-xl">
                      <div className="flex items-center justify-between gap-3">
                        <span className="shrink-0 text-sm font-bold bg-amber-400 text-slate-900 rounded-full px-3 py-1">
                          יום {index + 1}
                        </span>
                        <CardTitle className="text-right text-xl font-bold text-white leading-snug">
                          {formattedDates[index]}
                        </CardTitle>
                      </div>
                      {(day.segments[0]?.city || day.segments[0]?.hotelsDetails) && (
                        <div className="flex justify-end flex-wrap gap-2 mt-3">
                          {day.segments[0].city && (
                            <span className="inline-flex items-center gap-1.5 text-sm bg-white/15 text-white rounded-full px-3 py-1 border border-white/25">
                              <MapPin className="h-4 w-4 shrink-0" />
                              {day.segments[0].city}
                            </span>
                          )}
                          {day.segments[0].hotelsDetails && (
                            <span className="inline-flex items-center gap-1.5 text-sm bg-white/15 text-white rounded-full px-3 py-1 border border-white/25">
                              <BedDouble className="h-4 w-4 shrink-0" />
                              {day.segments[0].hotelsDetails}
                            </span>
                          )}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="flex flex-col flex-grow p-0">
                      {day.segments.map((segment, segIndex) => (
                        <div key={segment.id}>
                          <Link
                            href={`/trip/${segment.date}/${segment.timeSegmentNumeric}`}
                            onClick={() => history.replaceState(null, '', `#${day.date}`)}
                            passHref
                          >
                            {/* min-h-[60px] ensures 60px touch target — WCAG 2.5.5 for 65+ */}
                            <div className="flex flex-col justify-center min-h-[60px] px-5 py-4 hover:bg-amber-50 active:bg-amber-100 transition-colors border-r-4 border-transparent hover:border-amber-400 cursor-pointer">
                              <h4 className="font-bold text-right text-lg leading-snug">{segment.timeSegment}</h4>
                              <div
                                className="text-muted-foreground text-right text-base mt-1 leading-snug"
                                dangerouslySetInnerHTML={{ __html: segment.summary }}
                              />
                            </div>
                          </Link>
                          {segIndex < day.segments.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
