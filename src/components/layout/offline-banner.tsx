"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!isOffline) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-xl px-4">
        <div className="mt-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 shadow-sm flex items-center gap-2 px-3 py-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Offline mode: we’ll retry when your connection is back.
        </div>
      </div>
    </div>
  );
}
