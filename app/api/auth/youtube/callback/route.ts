// app/api/auth/youtube/callback/route.ts
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const uid = url.searchParams.get('state'); // from /api/auth/youtube?uid=...

    const origin = `${url.protocol}//${url.host}`;

    if (error) {
      return NextResponse.redirect(
        `${origin}/dashboard?error=youtube_oauth_denied`,
      );
    }

    if (!code || !uid) {
      return NextResponse.redirect(
        `${origin}/dashboard?error=youtube_missing_params`,
      );
    }

    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI ||
      `${origin}/api/auth/youtube/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube('v3');
    const me = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet'],
      mine: true,
    });

    const channel = me.data.items?.[0];
    const channelName = channel?.snippet?.title || 'YouTube Channel';

    // app/api/auth/youtube/callback/route.ts
    const connection = {
      id: `youtube_${uid}`,
      platform: 'youtube',          // ✅ lowercase
      platformId: channel?.id || 'youtube',
      accountName: channelName,
      accountLabel: channelName,
      accessToken: tokens.access_token ?? '',
      refreshToken: tokens.refresh_token ?? null,
      connectedAt: new Date(),
    };


    await adminDb
      .collection('users')
      .doc(uid)
      .set(
        { connectedAccounts: adminFieldValue.arrayUnion(connection) },
        { merge: true },
      );

    return NextResponse.redirect(
      `${origin}/dashboard?success=youtube_connected&youtube_connected=true`,
    );
  } catch (err) {
    console.error('YouTube callback error:', err);
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(
      `${origin}/dashboard?error=youtube_callback_failed`,
    );
  }
}
