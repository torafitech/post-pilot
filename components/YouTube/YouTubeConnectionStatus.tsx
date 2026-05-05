import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface YouTubeChannelInfo {
  title?: string;
  [key: string]: unknown;
}

interface YouTubeConnectionResponse {
  connected: boolean;
  channelInfo?: YouTubeChannelInfo | null;
}

interface AppSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AppSession {
  user?: AppSessionUser;
}

interface ConnectionStatusProps {
  onConnect?: () => void;
  onRefresh?: () => Promise<void>;
}

const YouTubeConnectionStatus: React.FC<ConnectionStatusProps> = ({
  onConnect,
  onRefresh,
}) => {
  const { data: session } = useSession() as { data: AppSession | null };
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(
    null
  );

  useEffect(() => {
    void checkConnectionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const checkConnectionStatus = async (): Promise<void> => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/youtube/connection?userId=${session.user.id}`
      );

      if (!response.ok) {
        setIsConnected(false);
        setChannelInfo(null);
        return;
      }

      const data = (await response.json()) as YouTubeConnectionResponse;

      setIsConnected(Boolean(data.connected));
      setChannelInfo((data.channelInfo as YouTubeChannelInfo) ?? null);
    } catch (error) {
      console.error('Failed to check connection status:', error);
      setIsConnected(false);
      setChannelInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    if (onRefresh) {
      await onRefresh();
      await checkConnectionStatus();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-gray-600">
            Checking YouTube connection...
          </span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-800">
              YouTube Account Not Connected
            </h3>
            <p className="text-yellow-700 mt-1">
              Connect your YouTube account to access analytics, videos, and
              detailed insights.
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={onConnect}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Connect YouTube Account</span>
              </button>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Go to YouTube</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              YouTube Account Connected
            </h3>
            <p className="text-green-700 mt-1">
              {channelInfo?.title ? (
                <>
                  Connected to:{' '}
                  <span className="font-medium">{channelInfo.title}</span>
                </>
              ) : (
                'Your YouTube account is successfully connected.'
              )}
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
              <button
                onClick={onConnect}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                Reconnect Account
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Connected
          </span>
          <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeConnectionStatus;
