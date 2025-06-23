import { getTripPlans, getTripSegment } from '@/lib/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

interface DetailPageProps {
  params: {
    date: string;
    segment: string;
  };
}

export default async function TripSegmentPage({ params }: DetailPageProps) {
  const segmentNumeric = parseInt(params.segment, 10);
  if (isNaN(segmentNumeric)) {
    notFound();
  }

  const allSegments = await getTripPlans('434');
  const dailySegments = allSegments
    .filter((s) => s.date === params.date)
    .sort((a, b) => a.timeSegmentNumeric - b.timeSegmentNumeric);
  
  const currentIndex = dailySegments.findIndex((s) => s.timeSegmentNumeric === segmentNumeric);

  if (currentIndex === -1) {
    notFound();
  }

  const segment = dailySegments[currentIndex];
  const nextSegment = currentIndex < dailySegments.length - 1 ? dailySegments[currentIndex + 1] : null;

  if (!segment) {
    notFound();
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
          <div className="text-muted-foreground text-right text-lg" dangerouslySetInnerHTML={{ __html: segment.summary }}/>
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

          <div className="mt-8 pt-6 border-t flex justify-end">
            {nextSegment && (
              <Button asChild>
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

export async function generateMetadata({ params }: DetailPageProps) {
  const segmentNumeric = parseInt(params.segment, 10);
  if (isNaN(segmentNumeric)) {
    return { title: 'פרטי טיול' }
  }
  const segment = await getTripSegment('434', params.date, segmentNumeric);

  if (!segment) {
    return { title: 'פרטי טיול' }
  }

  const cleanSummary = segment.summary.replace(/<[^>]*>?/gm, '');

  return {
    title: `${segment.timeSegment} - ${cleanSummary} | טיול ליפן`,
  }
}
