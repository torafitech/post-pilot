import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { userId, platform, accountName, accessToken, refreshToken } = await req.json();

    if (!userId || !platform || !accountName || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, 'users', userId);

    // Create connected account object
    const connectedAccount = {
      id: `${platform}_${Date.now()}`,
      platform,
      accountName,
      accessToken,
      refreshToken: refreshToken || null,
      connectedAt: new Date(),
    };

    // Update user document with new connected account
    await updateDoc(userDocRef, {
      connectedAccounts: arrayUnion(connectedAccount),
    });

    return NextResponse.json(
      { message: 'Account connected successfully', account: connectedAccount },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error connecting account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect account' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const connectedAccounts = userDoc.data().connectedAccounts || [];

    return NextResponse.json(
      { accounts: connectedAccounts },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
