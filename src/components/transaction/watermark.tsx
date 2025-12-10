"use client";

import React, { useEffect, useState } from 'react';

type WatermarkProps = {
  variant?: 'cover' | 'corner' | 'center';
  opacity?: number; // 0-1
  maxSize?: string; // e.g. 'w-80 h-80' or undefined
};

export default function Watermark({ variant = 'cover', opacity = 0.06, maxSize = 'w-80 h-80' }: WatermarkProps) {
  const sources = [
    '/images/ovomonie-watermark.png',
    '/images/ovomonie-watermark.webp',
    '/images/ovomonie-watermark.jpg',
    '/images/ovomonie-watermark.svg',
  ];

  const [srcIndex, setSrcIndex] = useState(0);
  const [triedAll, setTriedAll] = useState(false);

  useEffect(() => {
    if (srcIndex >= sources.length) setTriedAll(true);
  }, [srcIndex]);

  const handleImgError = () => setSrcIndex((i) => i + 1);

  // compute classes based on variant
    let containerClass = 'pointer-events-none absolute inset-0 flex items-center justify-center z-0';
    let imgClass = `${maxSize} object-contain mx-auto my-auto`;

  if (variant === 'cover') {
    containerClass = 'pointer-events-none absolute inset-0 overflow-visible flex items-center justify-center z-0';
    imgClass = 'w-full h-full object-cover';
  } else if (variant === 'corner') {
    containerClass = 'pointer-events-none absolute top-4 right-4 z-0';
    imgClass = `${maxSize} object-contain`;
  } else if (variant === 'center') {
    containerClass = 'pointer-events-none absolute inset-0 flex items-center justify-center z-0';
    imgClass = `${maxSize} object-contain`;
  }

  // Inline SVG fallback when no external image worked
  const InlineSVG = (
    <svg className={`${maxSize} text-muted-foreground`} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="200" fill="url(#g)" />
      <g transform="translate(100,100) rotate(-20)">
        <text x="0" y="0" textAnchor="middle" fontSize="32" fontWeight="700" fill="currentColor" fillOpacity={String(opacity)}>OVOMONIE</text>
      </g>
    </svg>
  );

  return (
      <div className={containerClass} aria-hidden>
      {!triedAll && srcIndex < sources.length ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={sources[srcIndex]}
          className={imgClass}
          onError={handleImgError}
          style={{
            opacity,
            maxWidth: variant === 'center' ? '80%' : undefined,
            maxHeight: variant === 'center' ? '80%' : undefined,
          }}
        />
      ) : (
        <div style={{ opacity, maxWidth: variant === 'center' ? '80%' : undefined, maxHeight: variant === 'center' ? '80%' : undefined }}>{InlineSVG}</div>
      )}
    </div>
  );
}
