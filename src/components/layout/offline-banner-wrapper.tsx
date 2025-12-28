"use client";

import dynamic from 'next/dynamic';

const OfflineBanner = dynamic(() => import('./offline-banner').then(mod => ({ default: mod.OfflineBanner })), { ssr: false });

export default function OfflineBannerWrapper() {
  return <OfflineBanner />;
}
