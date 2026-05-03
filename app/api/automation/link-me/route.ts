// app/api/automation/link-me/route.ts
// CRUD for "Link Me" rules: keyword triggers + auto-reply messages
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

export interface LinkMeRule {
  id?: string;
  keyword: string;          // Trigger keyword (case-insensitive match)
  replyMessage: string;     // Message to send when keyword detected
  platforms: string[];      // Which platforms to apply on ['youtube', 'twitter', 'linkedin']
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalMatches?: number;    // How many times this rule fired
}

// GET /api/automation/link-me — list all rules for user
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('linkMeRules')
      .orderBy('createdAt', 'desc')
      .get();

    const rules: LinkMeRule[] = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<LinkMeRule, 'id'>),
    }));

    return NextResponse.json({ rules });
  } catch (err: any) {
    console.error('Link Me GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/automation/link-me — create a new rule
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { keyword, replyMessage, platforms } = body as {
      keyword?: string;
      replyMessage?: string;
      platforms?: string[];
    };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }
    if (!replyMessage?.trim()) {
      return NextResponse.json({ error: 'Reply message is required' }, { status: 400 });
    }
    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform required' }, { status: 400 });
    }

    const betaPlatforms = ['youtube', 'twitter', 'linkedin'];
    const validPlatforms = platforms.filter((p) => betaPlatforms.includes(p));
    if (validPlatforms.length === 0) {
      return NextResponse.json({ error: 'No valid beta platforms selected' }, { status: 400 });
    }

    const now = new Date();
    const rule: Omit<LinkMeRule, 'id'> = {
      keyword: keyword.trim().toLowerCase(),
      replyMessage: replyMessage.trim(),
      platforms: validPlatforms,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      totalMatches: 0,
    };

    const docRef = await adminDb
      .collection('users')
      .doc(userId)
      .collection('linkMeRules')
      .add(rule);

    return NextResponse.json({ id: docRef.id, ...rule }, { status: 201 });
  } catch (err: any) {
    console.error('Link Me POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
