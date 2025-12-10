
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { PageLoader } from '@/components/layout/page-loader';
import BackButton from '@/components/layout/back-button';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'OVOMONIE',
  description: 'A revolutionary platform that combines modern banking with innovative lifestyle and financial solutions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <AuthProvider>
          <BackButton />
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
