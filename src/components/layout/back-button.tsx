"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  // Hide back button on welcome page
  const isWelcomePage = pathname === '/';

  useEffect(() => {
    try {
      // When history length is > 1 we can back, otherwise fallback to homepage
      setCanGoBack(typeof window !== 'undefined' && window.history.length > 1);
    } catch (e) {
      setCanGoBack(false);
    }
  }, []);

  const handleClick = () => {
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    } catch (e) {
      router.push('/');
    }
  };

  if (isWelcomePage) {
    return null;
  }

  return (
    <button
      aria-label="Go back"
      onClick={handleClick}
      className="fixed top-4 left-4 z-50 inline-flex items-center justify-center transition-transform hover:scale-105"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
}
