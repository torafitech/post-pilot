import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not configured' },
        { status: 500 }
      );
    }

    // Test 1: Get your Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      return NextResponse.json(
        { error: 'API Error', details: pagesData.error },
        { status: 400 }
      );
    }

    // Test 2: Try to get Instagram Business Account from first page
    let instagramAccountId = null;
    if (pagesData.data && pagesData.data.length > 0) {
      const pageId = pagesData.data[0].id;
      
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
      );
      const igData = await igResponse.json();
      
      if (igData.instagram_business_account) {
        instagramAccountId = igData.instagram_business_account.id;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Instagram API connection working!',
      data: {
        pages: pagesData.data,
        instagramAccountId: instagramAccountId,
        token: accessToken.substring(0, 20) + '...' // Show partial token for debugging
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
