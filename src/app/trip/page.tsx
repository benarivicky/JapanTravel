'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTripId } from '@/hooks/use-trip-id';
import { useAuth } from '@/hooks/use-auth';
import { getTripDays, getTripCustomerName } from '@/lib/database';
import type { TripDay } from '@/lib/types';
import { formatTripDate, getDayShortDescription } from '@/lib/trip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Terminal, ArrowRight, ArrowLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
          const [days, name] = await Promise.all([
            getTripDays(tripId),
            getTripCustomerName(tripId),
          ]);

          setCustomerName(name);

          if (days.length === 0) {
            setError(`לא נמצאו נתוני טיול עבור מזהה "${tripId}". אנא ודא שהמסמך קיים ב-Firestore בנתיב "tripPlans/${tripId}" ומכיל מערך תקין בשם "dailyItinerary".`);
            setTripDays([]);
          } else {
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

  // Returning from a day page lands on /trip#<date>; scroll that day card into view.
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
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-12 w-auto shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-right text-foreground leading-tight">
              תוכנית הטיול{customerName ? ` — ${customerName}` : ''}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
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
          /* Days list: 1 col phone → 2 col tablet → 3 col desktop */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {tripDays.map((day, index) => (
              <div key={day.date} ref={el => { cardRefs.current[day.date] = el; }}>
                <DayCard day={day} index={index} isActive={activeDate === day.date} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DayCard({ day, index, isActive }: { day: TripDay; index: number; isActive: boolean }) {
  const formattedDate = formatTripDate(day.date);
  const description = getDayShortDescription(day);

  return (
    <Link
      href={`/trip/${day.date}`}
      onClick={() => history.replaceState(null, '', `#${day.date}`)}
      className="group block h-full rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`יום ${index + 1}, ${formattedDate}`}
    >
      <Card
        className={cn(
          'flex flex-col h-full overflow-hidden transition-all duration-300',
          isActive
            ? 'ring-4 ring-offset-2 ring-ring shadow-xl shadow-primary/30'
            : 'shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5',
        )}
      >
        {/* Compact sun-red header (logo palette) — day number + date only */}
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 px-4 py-3 bg-gradient-to-l from-[#7e1418] to-[#b21f24] rounded-t-lg">
          <span className="shrink-0 text-sm font-bold bg-[#c99a5b] text-[#2b1d10] rounded-full px-2.5 py-0.5">
            יום {index + 1}
          </span>
          <CardTitle className="text-right text-base font-bold text-white leading-snug">
            {formattedDate}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col flex-grow p-4">
          {description && (
            <div
              className="text-muted-foreground text-right text-sm leading-snug line-clamp-2 [&_p]:inline [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          <div className="flex items-center justify-between mt-auto pt-3 text-primary">
            <span className="inline-flex items-center gap-1.5 font-bold text-sm group-hover:gap-2.5 transition-all">
              צפו ביום
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span className="text-xs text-muted-foreground">
              {day.segments.length} פעילויות
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
