
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import BackButton from '@/components/layout/back-button';
import { ensureFirestoreInit } from '@/lib/firestore-ping';
import { OfflineBanner } from "@/components/layout/offline-banner";

export const metadata: Metadata = {
  title: 'OVOMONIE',
  description: 'A revolutionary platform that combines modern banking with innovative lifestyle and financial solutions.',
};

if (typeof window === 'undefined') {
  // Initialize Firestore immediately on app start (server side).
  ensureFirestoreInit();
}

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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <OfflineBanner />
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
