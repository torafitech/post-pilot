'use client';

// Ad-platform tracking: UTM capture + Meta Pixel / Google Ads conversion events.
// IDs come from env so staging never fires production conversions.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '';
export const GOOGLE_ADS_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || '';

const UTM_STORAGE_KEY = 'sp_utm';

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
}

const EMPTY_UTM: UtmParams = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Persisted because the visitor may land with UTMs, browse, then convert on a
// later view where the query string is gone.
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return EMPTY_UTM;

  const search = new URLSearchParams(window.location.search);
  const fromUrl: UtmParams = {
    utmSource: search.get('utm_source'),
    utmMedium: search.get('utm_medium'),
    utmCampaign: search.get('utm_campaign'),
    utmContent: search.get('utm_content'),
  };

  const hasAny = Object.values(fromUrl).some(Boolean);
  if (hasAny) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      // private mode / storage disabled — in-memory value still works this view
    }
    return fromUrl;
  }

  return readStoredUtm();
}

export function readStoredUtm(): UtmParams {
  if (typeof window === 'undefined') return EMPTY_UTM;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return EMPTY_UTM;
    return { ...EMPTY_UTM, ...(JSON.parse(raw) as Partial<UtmParams>) };
  } catch {
    return EMPTY_UTM;
  }
}

export function trackLead(params: { value?: number; currency?: string; utm?: UtmParams }) {
  const { value, currency = 'INR', utm } = params;

  if (typeof window === 'undefined') return;

  window.fbq?.('track', 'Lead', {
    content_name: 'Founding Member Waitlist',
    value,
    currency,
    utm_source: utm?.utmSource ?? undefined,
    utm_medium: utm?.utmMedium ?? undefined,
    utm_campaign: utm?.utmCampaign ?? undefined,
    utm_content: utm?.utmContent ?? undefined,
  });

  if (GOOGLE_ADS_ID && GOOGLE_ADS_CONVERSION_LABEL) {
    window.gtag?.('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
      value,
      currency,
    });
  }

  window.gtag?.('event', 'generate_lead', {
    currency,
    value,
    utm_source: utm?.utmSource ?? undefined,
    utm_medium: utm?.utmMedium ?? undefined,
    utm_campaign: utm?.utmCampaign ?? undefined,
    utm_content: utm?.utmContent ?? undefined,
  });
}

export function trackWaitlistOpen() {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'InitiateCheckout', { content_name: 'Founding Member Waitlist' });
  window.gtag?.('event', 'waitlist_open');
}
