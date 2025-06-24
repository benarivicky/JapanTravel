'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { uploadTripPlan } from './actions';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Terminal, UploadCloud, CheckCircle, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function AdminUploadPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; tripId?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, authLoading, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
        setResult({ success: false, message: 'Please select a file to upload.' });
        return;
    }

    setIsLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const uploadResult = await uploadTripPlan(content);
      setResult(uploadResult);
      setIsLoading(false);
      if (uploadResult.success) {
        const form = event.target as HTMLFormElement;
        form.reset();
        setFile(null);
      }
    };
    reader.onerror = () => {
        setResult({ success: false, message: 'Failed to read the file.' });
        setIsLoading(false);
    }
    reader.readAsText(file);
  };
  
  if (authLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-8 px-4">
        <div className="mb-4">
            <Button asChild variant="ghost">
              <Link href="/admin" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-right">Admin: Upload Trip Plan</CardTitle>
                <CardDescription className="text-right">
                    Upload a JSON file to create or replace a trip plan in Firestore. The document ID will be the `TRIPID` from the file.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="trip-plan-file" className="text-right w-full block">JSON File</Label>
                        <Input id="trip-plan-file" type="file" accept=".json" onChange={handleFileChange} />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading || !file}>
                        {isLoading ? (
                            <>
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="ml-2 h-4 w-4" />
                                Upload File
                            </>
                        )}
                    </Button>
                </form>

                {result && (
                    <Alert variant={result.success ? 'default' : 'destructive'} className="mt-6" dir="rtl">
                        {result.success ? <CheckCircle className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                        <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>
                            {result.message}
                            {result.success && result.tripId && ` Trip ID: ${result.tripId}`}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </main>
  );
}
