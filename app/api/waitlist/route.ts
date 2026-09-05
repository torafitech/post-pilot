// app/api/waitlist/route.ts
// Public founding-member waitlist signup. Writes to `waitlist_registrations`.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';
import { BUSINESS_TYPES, WAITLIST_COLLECTION } from '@/lib/launch';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200)?.toLowerCase() ?? null;
  const businessType = clean(body.businessType, 60);

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (!businessType || !BUSINESS_TYPES.includes(businessType as (typeof BUSINESS_TYPES)[number])) {
    return NextResponse.json({ error: 'Select what you do' }, { status: 400 });
  }

  const record = {
    name,
    email,
    businessType,
    profileLink: clean(body.profileLink, 500) ?? '',
    utmSource: clean(body.utmSource, 200),
    utmMedium: clean(body.utmMedium, 200),
    utmCampaign: clean(body.utmCampaign, 200),
    referrer: clean(body.referrer, 500),
    userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    createdAt: adminFieldValue.serverTimestamp(),
  };

  try {
    // Doc id = email so a repeat submit updates instead of duplicating.
    await adminDb
      .collection(WAITLIST_COLLECTION)
      .doc(encodeURIComponent(email))
      .set(record, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[waitlist] write failed:', error);
    return NextResponse.json({ error: 'Could not save your registration' }, { status: 500 });
  }
}
