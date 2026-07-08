import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="טיול ליפן" className="mx-auto mb-4 w-64 max-w-full" />
        <h1 className="text-4xl font-headline font-bold text-center mb-8 text-foreground">
          טיול ליפן
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
