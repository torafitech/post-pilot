import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caption, imageUrl, scheduledDate, scheduledTime, accounts } = body;

    // Validation
    if (!caption || !scheduledDate || !scheduledTime || accounts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    // Create post document
    const postData = {
      caption,
      imageUrl: imageUrl || null,
      scheduledAt: scheduledDateTime,
      accounts, // ['instagram', 'youtube']
      status: 'scheduled', // scheduled, published, failed
      createdAt: serverTimestamp(),
      userId: 'demo_user', // We'll add real auth later
      platformPostIds: {}, // Will store Instagram post ID, YouTube video ID, etc.
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'posts'), postData);

    return NextResponse.json({
      success: true,
      message: 'Post scheduled successfully!',
      postId: docRef.id,
      scheduledAt: scheduledDateTime.toISOString(),
    });

  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post', details: error.message },
      { status: 500 }
    );
  }
}
// Function to publish to Instagram immediately
export async function publishToInstagram(imageUrl: string, caption: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com'}/api/instagram/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        caption,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error publishing to Instagram:', error);
    return null;
  }
}

