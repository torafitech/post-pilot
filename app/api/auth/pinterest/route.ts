// app/api/auth/pinterest/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Pinterest OAuth - Not yet fully implemented');
    
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    // For now, show a message that Pinterest auth is not ready
    return NextResponse.redirect(
      `${origin}/dashboard?error=pinterest_not_implemented`,
    );
  } catch (error: any) {
    console.error('Pinterest OAuth error:', error);
    return NextResponse.json(
      { error: 'Pinterest OAuth not yet implemented' },
      { status: 501 },
    );
  }
}
