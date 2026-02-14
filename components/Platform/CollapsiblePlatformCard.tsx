// components/Platform/CollapsiblePlatformCard.tsx
import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react';

type ConnectedAccount = {
  id: string;
  platform: string;
  accountName: string;
  connectedAt: Date;
};

type PlatformInfo = {
  icon: React.ReactNode;
  gradient: string;
  bgColor: string;
};

const platformData: Record<string, PlatformInfo> = {
  youtube: {
    icon: <Globe className="w-5 h-5" />,
    gradient: 'from-red-600 to-red-700',
    bgColor: 'bg-red-500/10',
  },
  twitter: {
    icon: <Globe className="w-5 h-5" />,
    gradient: 'from-sky-500 to-sky-600',
    bgColor: 'bg-sky-500/10',
  },
  instagram: {
    icon: <Globe className="w-5 h-5" />,
    gradient: 'from-pink-500 to-purple-500',
    bgColor: 'bg-pink-500/10',
  },
  linkedin: {
    icon: <Globe className="w-5 h-5" />,
    gradient: 'from-blue-600 to-blue-700',
    bgColor: 'bg-blue-500/10',
  },
};

interface CollapsiblePlatformCardProps {
  platform: string;
  account: ConnectedAccount;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  actionButtons?: React.ReactNode;
}

const CollapsiblePlatformCard: React.FC<CollapsiblePlatformCardProps> = ({
  platform,
  account,
  isExpanded,
  onToggle,
  children,
  actionButtons,
}) => {
  const platformKey = platform.toLowerCase();
  const platformInfo =
    platformData[platformKey] || {
      icon: <Globe className="w-5 h-5" />,
      gradient: 'from-gray-600 to-gray-700',
      bgColor: 'bg-gray-500/10',
    };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-800/40 transition-colors"
      >
        {/* Left: Icon + text */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`p-2 rounded-lg sm:p-2.5 ${platformInfo.bgColor}`}>
            <div className="text-white">{platformInfo.icon}</div>
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </h3>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                Connected
              </span>
            </div>
            <p className="text-sm text-gray-400 truncate max-w-[220px] sm:max-w-sm">
              {account.accountName}
            </p>
            <p className="text-xs text-gray-500">
              Connected {account.connectedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right: actions + chevron */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* On mobile, actions appear left of chevron; on desktop they sit inline */}
          {actionButtons && (
            <div className="flex items-center gap-2">
              {actionButtons}
            </div>
          )}

          <div
            className={`p-1.5 rounded-lg border border-gray-700/60 bg-gray-800/60 flex items-center justify-center transition-transform ${
              isExpanded ? 'rotate-0' : ''
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="border-t border-gray-700 bg-gray-950/60 px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsiblePlatformCard;
