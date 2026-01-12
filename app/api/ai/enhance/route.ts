// app/api/ai/enhance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  console.log('🎯 AI Enhancement API Called');

  try {
    const body = await req.json();
    const { caption, platform, platforms, tone, contentType } = body;

    console.log('Request data:', { caption, platform, platforms, tone, contentType });

    if (!caption || caption.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Caption is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ No OpenAI API key found');
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 },
      );
    }

    console.log('✅ API key found, initializing OpenAI...');

    const openai = new OpenAI({ apiKey });

    // Platform rules
    const platformRules: Record<string, any> = {
      youtube: {
        maxLength: 5000,
        tips: 'Use engaging hooks, timestamps, call-to-action',
        style: 'Descriptive and informative',
      },
      instagram: {
        maxLength: 2200,
        tips: 'Line breaks, emojis, 10-30 hashtags',
        style: 'Visual and engaging',
      },
      twitter: {
        maxLength: 280,
        tips: 'Concise, 1-2 hashtags, strategic emojis',
        style: 'Punchy and conversational',
      },
      linkedin: {
        maxLength: 3000,
        tips: 'Professional tone, storytelling',
        style: 'Professional and thought-provoking',
      },
      tiktok: {
        maxLength: 150,
        tips: 'Hook first, trending sounds, hashtags',
        style: 'Trendy and creative',
      },
      facebook: {
        maxLength: 2000,
        tips: 'Conversational, emojis, engagement questions',
        style: 'Friendly and conversational',
      },
    };

    const selectedPlatforms = platforms || [platform];
     console.log('Selected platforms for time platforms:', platforms);
     console.log('Selected platforms for time platform:', platform);
    console.log('Selected platforms for time suggestions:', selectedPlatforms);
    const rules = platformRules[platform] || platformRules['instagram'];

    console.log('📤 Generating enhanced caption...');

    // Enhanced Caption
    const captionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a ${platform} content expert. Enhance captions to be viral-worthy with emojis and formatting. Style: ${rules.style}. Max: ${rules.maxLength} chars. ${rules.tips}`,
        },
        {
          role: 'user',
          content: `Enhance this caption: "${caption}"`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const enhancedCaption =
      captionResponse.choices[0].message.content?.trim() || caption;
    console.log('✅ Enhanced caption generated');

    console.log('📤 Generating hashtags...');

    // Hashtags
    const hashtagResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate ${platform === 'instagram' ? '15-25' : '5-8'} trending hashtags for ${platform}. Return ONLY hashtags separated by spaces, no explanations.`,
        },
        {
          role: 'user',
          content: caption,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const hashtags = hashtagResponse.choices[0].message.content?.trim() || '';
    console.log('✅ Hashtags generated');

    console.log('📤 Calculating best posting times for all platforms...');

    // 🔹 GENERATE BEST TIMES FOR ALL PLATFORMS
    const platformTimes: Record<string, any> = {};

    for (const plat of selectedPlatforms) {
      try {
        const timeResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a social media expert. Suggest the BEST day and time to post on ${plat} for ${contentType || 'general'} content in IST timezone. 

Format your response EXACTLY as JSON on a single line (NO line breaks):
{"day": "Monday", "time": "09:00", "reason": "Peak engagement time"}

Only JSON, nothing else.`,
            },
            {
              role: 'user',
              content: `Content type: ${contentType || 'general'}, Topic: ${caption.substring(0, 50)}`,
            },
          ],
          temperature: 0.6,
          max_tokens: 100,
        });

        const timeText = timeResponse.choices[0].message.content?.trim() || '';
        console.log(`Raw time response for ${plat}:`, timeText);

        // Parse JSON response
        const timeData = JSON.parse(timeText);
        platformTimes[plat] = {
          day: timeData.day || 'Monday',
          time: timeData.time || '12:00',
          reason: timeData.reason || `Optimal posting time for ${plat}`,
        };

        console.log(`✅ Best time for ${plat}:`, platformTimes[plat]);
      } catch (error) {
        console.error(`Error getting time for ${plat}:`, error);
        // Fallback times
        const fallbackTimes: Record<string, any> = {
          instagram: { day: 'Tuesday', time: '18:00', reason: 'Peak engagement' },
          facebook: { day: 'Wednesday', time: '12:00', reason: 'Best reach' },
          twitter: { day: 'Thursday', time: '09:00', reason: 'High activity' },
          linkedin: { day: 'Tuesday', time: '10:00', reason: 'Professional hours' },
          tiktok: { day: 'Friday', time: '18:00', reason: 'Trending time' },
          youtube: { day: 'Thursday', time: '14:00', reason: 'Peak viewing' },
        };
        platformTimes[plat] = fallbackTimes[plat] || fallbackTimes['instagram'];
      }
    }

    console.log('✨ AI Enhancement Complete!');

    return NextResponse.json({
      success: true,
      enhancedCaption,
      hashtags,
      platformTimes, // 🔹 Return times for ALL platforms
      originalLength: caption.length,
      enhancedLength: enhancedCaption.length,
      platform,
    });
  } catch (error: any) {
    console.error('❌ AI Enhancement Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'AI enhancement failed. Please try again.',
      },
      { status: 500 },
    );
  }
}
