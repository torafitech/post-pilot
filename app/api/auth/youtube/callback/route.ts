// app/api/auth/youtube/callback/route.ts
export const dynamic = 'force-dynamic';

import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('YouTube callback START', request.url);

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const uid = url.searchParams.get('state');
    const origin = `${url.protocol}//${url.host}`;

    if (error) {
      console.warn('YouTube callback error param from Google:', error);
      return NextResponse.redirect(
        `${origin}/dashboard?error=youtube_oauth_denied`,
      );
    }

    if (!code || !uid) {
      console.warn('YouTube callback missing params', { code, uid });
      return NextResponse.redirect(
        `${origin}/dashboard?error=youtube_missing_params`,
      );
    }

    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
    const redirectEnv = process.env.YOUTUBE_REDIRECT_URI;
    const redirectUri = redirectEnv || `${origin}/api/auth/youtube/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    const res = await oauth2Client.getToken(code);
    const tokens = res.tokens;

    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube('v3');
    const me = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet', 'statistics'],
      mine: true,
    });

    const channel = me.data.items?.[0];

    if (!channel || !channel.id) {
      console.warn('YouTube callback: no channel returned for user', { uid });
      return NextResponse.redirect(
        `${origin}/dashboard?error=youtube_no_channel`,
      );
    }

    const channelId = channel.id;
    const channelName = channel.snippet?.title || 'YouTube Channel';

    // UNIQUE per user + channel
    const accountId = `youtube_${uid}_${channelId}`;

    const connection = {
      id: accountId,
      platform: 'youtube',
      platformId: channelId,
      accountName: channelName,
      accountLabel: channelName,
      accessToken: tokens.access_token ?? '',
      refreshToken: tokens.refresh_token ?? null,
      connectedAt: new Date(),
    };

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};
    const existingList = (userData.connectedAccounts || []) as any[];

    // Upsert: if same channel already exists, update tokens; else push new account
    const idx = existingList.findIndex(
      (acc) =>
        acc.platform === 'youtube' &&
        (acc.platformId === channelId || acc.id === accountId),
    );

    if (idx >= 0) {
      const updated = [...existingList];
      updated[idx] = { ...updated[idx], ...connection };
      await userRef.set({ connectedAccounts: updated }, { merge: true });
    } else {
      await userRef.set(
        {
          connectedAccounts: adminFieldValue.arrayUnion(connection),
        },
        { merge: true },
      );
    }

    // Per-account doc (you can later change doc id to accountId if you want)
    const ytDocRef = adminDb
      .collection('users')
      .doc(uid)
      .collection('accounts')
      .doc(accountId);

    await ytDocRef.set(
      {
        platform: 'youtube',
        channelId,
        channelName,
        channelHandle: channel.snippet?.customUrl || null,
        accessToken: tokens.access_token ?? '',
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expiry_date || null,
        connectedAt: adminFieldValue.serverTimestamp(),
        stats: {
          subscribers: channel.statistics?.subscriberCount
            ? Number(channel.statistics.subscriberCount)
            : null,
          views: channel.statistics?.viewCount
            ? Number(channel.statistics.viewCount)
            : null,
          videoCount: channel.statistics?.videoCount
            ? Number(channel.statistics.videoCount)
            : null,
        },
      },
      { merge: true },
    );

    console.log('YouTube connection stored for uid', uid, 'channelId', channelId);

    return NextResponse.redirect(
      `${origin}/dashboard?success=youtube_connected&youtube_connected=true`,
    );
  } catch (err: any) {
    console.error(
      'YouTube callback error (outer catch):',
      err?.response?.data || err?.message || err,
    );
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(
      `${origin}/dashboard?error=youtube_callback_failed`,
    );
  }
}
