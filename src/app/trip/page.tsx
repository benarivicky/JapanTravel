'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Loader2, Terminal, ArrowRight } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function TripPage() {
  const router = useRouter();
  const { tripId, loading: tripIdLoading, clearTripId } = useTripId();
  const { isAdmin, loading: authLoading } = useAuth();
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              if (!acc[date]) {
                acc[date] = [];
              }
              acc[date].push(segment);
              return acc;
            }, {} as Record<string, typeof segments>);

            const days: TripDay[] = Object.entries(groupedByDate)
              .map(([date, segments]) => ({
                date,
                segments: segments.sort((a, b) => a.timeSegmentNumeric - b.timeSegmentNumeric),
              }))
              .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setTripDays(days);
          }
        } catch (e: any) {
            setError(`אירעה שגיאה בטעינת הטיול. ייתכן שיש בעיית הרשאות ב-Firestore או שהנתונים אינם תקינים. שגיאה: ${e.message}`);
            console.error(e);
        } finally {
            setLoading(false);
        }
      };
      fetchTripData();
    }
  }, [tripId]);

  const formattedDates = useMemo(() => {
    return tripDays.map(day => {
      const date = new Date(day.date);
      return new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(date);
    })
  }, [tripDays])

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
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
          <div className="flex w-max space-x-4 space-x-reverse p-4">
            {tripDays.map((day, index) => (
              <Card key={day.date} className="w-[350px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-right text-xl font-semibold">
                    {formattedDates[index]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <div className="flex-grow">
                    {day.segments.map((segment, segIndex) => (
                      <div key={segment.id}>
                        <Link href={`/trip/${segment.date}/${segment.timeSegmentNumeric}`} passHref>
                          <div className="block p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                            <h4 className="font-bold text-right">{segment.timeSegment}</h4>
                            <div className="text-muted-foreground text-right whitespace-normal" dangerouslySetInnerHTML={{ __html: segment.summary }}></div>
                          </div>
                        </Link>
                        {segIndex < day.segments.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
