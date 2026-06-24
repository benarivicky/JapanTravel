import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Feedback } from "@/components/feedback"

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
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
        <Feedback />
      </body>
    </html>
  );
}
