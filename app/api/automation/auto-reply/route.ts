// app/api/automation/auto-reply/route.ts
// CRUD for auto-reply templates
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

export interface AutoReplyTemplate {
  id?: string;
  name: string;             // Template name for UI
  message: string;          // Reply message (may include {username} placeholder)
  platforms: string[];      // Platforms to apply on
  isActive: boolean;
  useAI: boolean;           // If true, generate reply with AI instead of fixed message
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('autoReplyTemplates')
      .orderBy('createdAt', 'desc')
      .get();

    const templates: AutoReplyTemplate[] = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<AutoReplyTemplate, 'id'>),
    }));

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, message, platforms, useAI } = body as {
      name?: string;
      message?: string;
      platforms?: string[];
      useAI?: boolean;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    if (!useAI && !message?.trim()) {
      return NextResponse.json({ error: 'Message is required when not using AI' }, { status: 400 });
    }
    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform required' }, { status: 400 });
    }

    const betaPlatforms = ['youtube', 'twitter', 'linkedin'];
    const validPlatforms = platforms.filter((p) => betaPlatforms.includes(p));

    const now = new Date();
    const template: Omit<AutoReplyTemplate, 'id'> = {
      name: name.trim(),
      message: message?.trim() || '',
      platforms: validPlatforms,
      isActive: true,
      useAI: !!useAI,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb
      .collection('users')
      .doc(userId)
      .collection('autoReplyTemplates')
      .add(template);

    return NextResponse.json({ id: docRef.id, ...template }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
