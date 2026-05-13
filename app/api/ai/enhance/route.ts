import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { caption, platforms, contentType } = await req.json();

    if (!caption?.trim()) return NextResponse.json({ success: false, error: 'Caption is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'OpenAI API key not configured' }, { status: 500 });

    const openai = new OpenAI({ apiKey });

    const selectedPlatforms: string[] = (platforms || []).filter((p: string) =>
      ['youtube', 'twitter', 'linkedin', 'instagram', 'facebook', 'threads'].includes(p)
    );

    // ── Call 1: all platform captions + hashtags in one shot ──────────────
    const captionsResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a multi-platform social media expert. Given a caption, rewrite it optimally for each platform and generate relevant hashtags.

Platform rules:
- youtube: descriptive, engaging hooks, timestamps/CTAs encouraged, up to 5000 chars. Also provide a short video title (max 100 chars) and 5-8 SEO tags.
- twitter: punchy, max 270 chars, 1-2 hashtags only, emojis OK
- linkedin: professional, storytelling, thought-provoking question at end, 150-1500 chars
- instagram: strong hook first line, emotive, up to 2200 chars, up to 10 hashtags
- facebook: conversational, ask a question to drive comments, 100-500 chars ideal
- threads: casual, direct, max 480 chars, 2-3 hashtags

Return JSON exactly in this shape:
{
  "captions": {
    "youtube":   { "title": "...", "description": "...", "tags": ["tag1","tag2"] },
    "twitter":   { "caption": "...", "hashtags": ["#tag1","#tag2"] },
    "linkedin":  { "caption": "...", "hashtags": ["#tag1","#tag2"] },
    "instagram": { "caption": "...", "hashtags": ["#tag1","#tag2","#tag3"] },
    "facebook":  { "caption": "...", "hashtags": ["#tag1","#tag2"] },
    "threads":   { "caption": "...", "hashtags": ["#tag1","#tag2"] }
  },
  "enhancedCaption": "best general-purpose version of the caption"
}`,
        },
        {
          role: 'user',
          content: `Original caption: "${caption}"\nContent type: ${contentType || 'general'}`,
        },
      ],
      temperature: 0.75,
      max_tokens: 1200,
    });

    const captionsData = JSON.parse(captionsResponse.choices[0].message.content || '{}');

    // ── Call 2: optimal post times for all selected platforms ─────────────
    const timesResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a social media timing expert. Return the single best day and time to post on each platform in IST timezone for the given content type.

Return JSON exactly:
{
  "platformTimes": {
    "youtube":   { "day": "Thursday", "time": "14:00", "reason": "..." },
    "twitter":   { "day": "Wednesday", "time": "09:00", "reason": "..." },
    "linkedin":  { "day": "Tuesday", "time": "10:00", "reason": "..." },
    "instagram": { "day": "Friday", "time": "18:00", "reason": "..." },
    "facebook":  { "day": "Thursday", "time": "13:00", "reason": "..." },
    "threads":   { "day": "Monday", "time": "20:00", "reason": "..." }
  }
}`,
        },
        {
          role: 'user',
          content: `Platforms: ${selectedPlatforms.join(', ') || 'all'}. Content type: ${contentType || 'general'}. Topic: ${caption.substring(0, 80)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const timesData = JSON.parse(timesResponse.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      enhancedCaption: captionsData.enhancedCaption || caption,
      platformCaptions: captionsData.captions || {},
      platformTimes: timesData.platformTimes || {},
      originalLength: caption.length,
      enhancedLength: (captionsData.enhancedCaption || caption).length,
    });

  } catch (error: any) {
    console.error('AI Enhancement Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'AI enhancement failed' }, { status: 500 });
  }
}
