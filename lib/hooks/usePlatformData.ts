// lib/hooks/usePlatformData.ts
'use client';

import { useEffect, useState } from 'react';
import { PlatformMetrics } from '@/types/platform';

export function usePlatformData(platform: string, userId: string | null) {
  const [data, setData] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !platform) {
      setLoading(false);
      return;
    }

    const fetchPlatformData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/platforms/${platform.toLowerCase()}/analytics?userId=${userId}`
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Failed to fetch ${platform} data`
          );
        }

        const platformData = await res.json();
        setData(platformData);
        
        console.log(`[usePlatformData] ${platform} data fetched:`, {
          profile: platformData.profile?.name,
          contentCount: platformData.content?.length,
        });
      } catch (err: any) {
        console.error(`[usePlatformData] ${platform} error:`, err);
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformData();
  }, [platform, userId]);

  return { data, loading, error };
}