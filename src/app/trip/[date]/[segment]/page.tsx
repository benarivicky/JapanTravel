import { getTripSegment } from '@/lib/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink } from 'lucide-react';

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

  const segment = await getTripSegment('434', params.date, segmentNumeric);

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
          <p className="text-muted-foreground text-right text-lg">{segment.summary}</p>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-blue dark:prose-invert max-w-none text-right"
            dangerouslySetInnerHTML={{ __html: segment.detailedContent }}
          />

          {segment.linkLink && segment.linkTitle && (
            <div className="mt-8 text-right">
              <Button asChild variant="link" className="p-0 h-auto">
                <a href={segment.linkLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg">
                  {segment.linkTitle}
                  <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            </div>
          )}
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

  return {
    title: `${segment.timeSegment} - ${segment.summary} | טיול ליפן`,
  }
}
