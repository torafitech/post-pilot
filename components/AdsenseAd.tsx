// components/AdsenseAd.tsx
'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdsenseAdProps {
  slot: string;      // real slot id, e.g. "1234567890"
  className?: string;
}

export function AdsenseAd({ slot, className }: AdsenseAdProps) {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!adRef.current) return;

    const el = adRef.current as any;

    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }

    if (el.dataset.adInitialized === 'true') return;

    try {
      (window.adsbygoogle as any).push({});
      el.dataset.adInitialized = 'true';
    } catch {
      // ignore
    }
  }, []);


  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7342126104264680"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
