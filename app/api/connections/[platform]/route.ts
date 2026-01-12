import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

type PlatformKey = 'instagram' | 'youtube' | 'twitter' | 'linkedin';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ platform: PlatformKey }> },
) {
  try {
    const { platform } = await context.params; // <-- await the params
    const userId = 'demo_user';

    // Get the user document
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    const userData = snap.data() as any;
    const accounts = userData.connectedAccounts || [];

    // Find the account to remove
    const accountToRemove = accounts.find((acc: any) => acc.platform === platform);

    if (!accountToRemove) {
      return NextResponse.json(
        { success: false, error: 'Account not connected' },
        { status: 404 },
      );
    }

    // Remove from connectedAccounts array
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        connectedAccounts: adminFieldValue.arrayRemove(accountToRemove),
      });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Disconnect error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 },
    );
  }
}
