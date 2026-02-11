// lib/services/platforms/platform.factory.ts
import { PlatformService } from '@/types/platform';
import { YouTubeService } from './youtube.service';
// Import other platform services as they are created
// import { InstagramService } from './instagram.service';
// import { TwitterService } from './twitter.service';

export class PlatformFactory {
  static createService(platform: string): PlatformService | null {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return new YouTubeService();
      case 'instagram':
        // return new InstagramService();
        console.log('Instagram service not yet implemented');
        return null;
      case 'twitter':
        // return new TwitterService();
        console.log('Twitter service not yet implemented');
        return null;
      default:
        console.log(`Platform ${platform} not supported`);
        return null;
    }
  }

  static async getPlatformData(platform: string, userId: string) {
    const service = this.createService(platform);
    if (!service) return null;

    try {
      const [profile, content, analytics, trends] = await Promise.all([
        service.fetchProfile(userId),
        service.fetchContent(userId),
        service.fetchAnalytics(userId),
        service.fetchTrends(userId),
      ]);

      return {
        platform,
        profile,
        content,
        analytics,
        trends,
      };
    } catch (error) {
      console.error(`Error fetching ${platform} data:`, error);
      return null;
    }
  }
}