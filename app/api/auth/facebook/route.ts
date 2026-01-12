// app/api/auth/facebook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Facebook OAuth - Not yet fully implemented');
    
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    // For now, show a message that Facebook auth is not ready
    return NextResponse.redirect(
      `${origin}/dashboard?error=facebook_not_implemented`,
    );
  } catch (error: any) {
    console.error('Facebook OAuth error:', error);
    return NextResponse.json(
      { error: 'Facebook OAuth not yet implemented' },
      { status: 501 },
    );
  }
}
