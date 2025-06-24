'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';

import { createNewUser } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Terminal, CheckCircle, ArrowLeft, UserPlus } from 'lucide-react';

const NewUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  tripId: z.string().nonempty({ message: 'Trip ID cannot be empty.' }),
});

export default function AdminNewUserPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, authLoading, router]);

  const form = useForm<z.infer<typeof NewUserSchema>>({
    resolver: zodResolver(NewUserSchema),
    defaultValues: {
      email: '',
      password: '',
      tripId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof NewUserSchema>) {
    setIsLoading(true);
    setResult(null);
    const creationResult = await createNewUser(values);
    setResult(creationResult);
    setIsLoading(false);
    if (creationResult.success) {
      form.reset();
    }
  }
  
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
                <CardTitle className="text-3xl font-bold text-right">Admin: Create New User</CardTitle>
                <CardDescription className="text-right">
                    Create a new user account in Firebase and assign them a Trip ID.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-right w-full block">Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="user@example.com" {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-right w-full block">Password</FormLabel>

                                    <FormControl>
                                        <Input type="password" placeholder="Min. 6 characters" {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tripId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-right w-full block">Trip ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 434" {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    Creating User...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="ml-2 h-4 w-4" />
                                    Create User
                                </>
                            )}
                        </Button>
                    </form>
                </Form>

                {result && (
                    <Alert variant={result.success ? 'default' : 'destructive'} className="mt-6" dir="rtl">
                        {result.success ? <CheckCircle className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                        <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>
                            {result.message}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </main>
  );
}
