// app/api/auth/tiktok/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('TikTok OAuth - Not yet fully implemented');
    
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    // For now, show a message that TikTok auth is not ready
    return NextResponse.redirect(
      `${origin}/dashboard?error=tiktok_not_implemented`,
    );
  } catch (error: any) {
    console.error('TikTok OAuth error:', error);
    return NextResponse.json(
      { error: 'TikTok OAuth not yet implemented' },
      { status: 501 },
    );
  }
}
