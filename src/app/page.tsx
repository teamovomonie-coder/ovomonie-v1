
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MainDashboard } from '@/components/dashboard/main-dashboard';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We need to wait until the auth state is determined from localStorage
    if (isAuthenticated === false) {
      router.push('/login');
    } else if (isAuthenticated === true) {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <MainDashboard />;
}
