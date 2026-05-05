// mobile/src/components/PlatformIcon.tsx
import React from 'react';
import { FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { platformColors } from '@/lib/theme';
import type { Platform } from '@/lib/platformConfig';

interface Props {
  platform: Platform | string;
  size?: number;
  color?: string;
}

export function PlatformIcon({ platform, size = 18, color }: Props) {
  const c = color || platformColors[platform] || '#a1a1aa';
  switch (platform) {
    case 'youtube':   return <FontAwesome5 name="youtube" size={size} color={c} />;
    case 'twitter':   return <FontAwesome5 name="twitter" size={size} color={c} />;
    case 'linkedin':  return <FontAwesome5 name="linkedin" size={size} color={c} />;
    case 'instagram': return <FontAwesome5 name="instagram" size={size} color={c} />;
    case 'facebook':  return <FontAwesome5 name="facebook" size={size} color={c} />;
    case 'tiktok':    return <FontAwesome5 name="tiktok" size={size} color={c} />;
    case 'threads':   return <MaterialCommunityIcons name="at" size={size} color={c} />;
    default:          return <Feather name="globe" size={size} color={c} />;
  }
}
