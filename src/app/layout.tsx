import type {Metadata} from 'next';
import { Fredoka } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'טיול ליפן',
  description: 'אפליקציית תכנון טיול ליפן',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={fredoka.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
