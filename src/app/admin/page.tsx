'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UploadCloud, ArrowLeft } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

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
    <main className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-headline font-bold text-right text-foreground">
                Admin Dashboard
            </h1>
            <Button asChild variant="ghost">
              <Link href="/trip" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Trip
              </Link>
            </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-right justify-end"><UploadCloud /> Upload Trip Plan</CardTitle>
                    <CardDescription className="text-right">
                        Upload a JSON file to create or replace a trip plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/admin/upload">Go to Upload</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-right justify-end"><UserPlus /> Create New User</CardTitle>
                    <CardDescription className="text-right">
                        Create a new user account and assign a Trip ID.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/admin/new-user">Go to User Creation</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    </main>
  );
}
