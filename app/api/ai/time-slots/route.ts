import { NextRequest, NextResponse } from 'next/server';

interface TimeSlot {
  platform: string;
  time: string;
  date: string;
  engagementScore: number;
  description: string;
}

// Optimal posting times for each platform based on engagement data
const platformOptimalTimes = {
  instagram: {
    description: 'Peak engagement time for Instagram',
    times: ['09:00', '13:00', '17:00', '20:00'],
    factors: {
      weekday: { morning: 85, afternoon: 90, evening: 92 },
      weekend: { morning: 75, afternoon: 88, evening: 85 },
    },
  },
  facebook: {
    description: 'Best time for Facebook reach',
    times: ['08:00', '12:00', '15:00', '19:00'],
    factors: {
      weekday: { morning: 78, afternoon: 82, evening: 88 },
      weekend: { morning: 70, afternoon: 80, evening: 82 },
    },
  },
  twitter: {
    description: 'High Twitter activity period',
    times: ['07:00', '12:00', '16:00', '21:00'],
    factors: {
      weekday: { morning: 80, afternoon: 85, evening: 88 },
      weekend: { morning: 72, afternoon: 78, evening: 80 },
    },
  },
  linkedin: {
    description: 'Professional hours for LinkedIn',
    times: ['08:00', '11:00', '14:00', '17:00'],
    factors: {
      weekday: { morning: 88, afternoon: 90, evening: 75 },
      weekend: { morning: 60, afternoon: 65, evening: 62 },
    },
  },
  tiktok: {
    description: 'Trending time on TikTok',
    times: ['09:00', '12:00', '18:00', '22:00'],
    factors: {
      weekday: { morning: 82, afternoon: 85, evening: 95 },
      weekend: { morning: 80, afternoon: 88, evening: 92 },
    },
  },
  youtube: {
    description: 'Optimal YouTube viewing time',
    times: ['10:00', '14:00', '18:00', '21:00'],
    factors: {
      weekday: { morning: 75, afternoon: 85, evening: 90 },
      weekend: { morning: 78, afternoon: 88, evening: 85 },
    },
  },
};

function calculateEngagementScore(
  platform: string,
  time: string,
  date: Date,
): number {
  const hour = parseInt(time.split(':')[0]);
  const day = date.getDay();
  const isWeekday = day >= 1 && day <= 5;
  
  const platformConfig = platformOptimalTimes[platform as keyof typeof platformOptimalTimes];
  if (!platformConfig) return 75;

  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const period = isWeekday ? 'weekday' : 'weekend';
  
  const baseScore = platformConfig.factors[period as keyof typeof platformConfig.factors][
    timeOfDay as keyof typeof platformConfig.factors.weekday
  ];
  
  // Add some variance based on specific hour
  const variance = Math.sin(hour / 24 * Math.PI) * 5;
  return Math.round(baseScore + variance);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platforms, caption, contentType } = body as {
      platforms: string[];
      caption?: string;
      contentType?: string;
    };

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No platforms provided' },
        { status: 400 }
      );
    }

    const timeSlots: TimeSlot[] = [];
    const now = new Date();
    
    // Generate slots for next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      // Skip past dates
      if (dayOffset === 0 && now.getHours() >= 23) continue;

      platforms.forEach((platform) => {
        const config = platformOptimalTimes[platform as keyof typeof platformOptimalTimes];
        if (!config) return;

        // Get top 2 times for this platform
        config.times.slice(0, 2).forEach((time) => {
          const engagementScore = calculateEngagementScore(platform, time, currentDate);

          timeSlots.push({
            platform,
            time,
            date: currentDate.toISOString().split('T')[0],
            engagementScore,
            description: config.description,
          });
        });
      });
    }

    // Sort by engagement score (highest first)
    timeSlots.sort((a, b) => b.engagementScore - a.engagementScore);

    // Return top slots (limit to avoid overwhelming the UI)
    const topSlots = timeSlots.slice(0, 20);

    console.log('✅ Generated AI time slots:', {
      platforms,
      slotCount: topSlots.length,
      topSlots: topSlots.slice(0, 3),
    });

    return NextResponse.json({
      success: true,
      timeSlots: topSlots,
      message: 'AI-generated optimal posting times for maximum engagement',
    });
  } catch (error) {
    console.error('❌ Error generating time slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate time slots' },
      { status: 500 }
    );
  }
}
