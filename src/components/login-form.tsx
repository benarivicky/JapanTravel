'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTripId } from '@/hooks/use-trip-id';
import { signInWithEmailAndPassword } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'כתובת אימייל לא תקינה.' }),
  password: z.string().min(6, { message: 'הסיסמה חייבת להכיל לפחות 6 תווים.' }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { saveTripId } = useTripId();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await signInWithEmailAndPassword(values.email, values.password);

    if (result.success && result.tripId) {
      saveTripId(result.tripId);
      toast({
        title: 'התחברות מוצלחת',
        description: 'מיד תועבר לעמוד הטיול שלך.',
      });
      router.push('/trip');
    } else {
      toast({
        variant: 'destructive',
        title: 'שגיאת התחברות',
        description: result.error || 'אירעה שגיאה לא צפויה.',
      });
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-right">התחברות</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right w-full block">אימייל</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} dir="ltr" />
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
                  <FormLabel className="text-right w-full block">סיסמה</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
