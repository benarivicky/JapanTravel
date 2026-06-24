'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FeedbackInbox } from '@amitkuzi/feedback-widget';
import { createFirestoreStore } from '@amitkuzi/feedback-widget/firestore';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const store = useMemo(
    () => createFirestoreStore({ db, collectionName: 'feedback' }),
    []
  );

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, authLoading, router]);

  if (authLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground">
          Client Feedback
        </h1>
        <Button asChild variant="ghost">
          <Link href="/admin" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
      </div>
      <FeedbackInbox store={store} project="japantravel" />
    </main>
  );
}
