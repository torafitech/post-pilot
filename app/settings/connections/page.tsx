'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type PlatformKey = 'instagram' | 'youtube' | 'twitter' | 'linkedin';

interface PlatformConnection {
  connected: boolean;
  displayName?: string;
}

interface ConnectionsSummary {
  instagram: PlatformConnection;
  youtube: PlatformConnection;
  twitter: PlatformConnection;
  linkedin: PlatformConnection;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionsSummary>({
    instagram: { connected: false },
    youtube: { connected: false },
    twitter: { connected: false },
    linkedin: { connected: false },
  });

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await fetch('/api/connections');
        const data = await res.json();

        setConnections({
          instagram: {
            connected: !!data.instagram,
            displayName: data.instagram?.pageName || 'Instagram Business',
          },
          youtube: {
            connected: !!data.youtube,
            displayName: data.youtube?.channelName || 'YouTube',
          },
          twitter: {
            connected: !!data.twitter,
            displayName: data.twitter?.handle || '@yourhandle',
          },
          linkedin: {
            connected: !!data.linkedin,
            displayName: data.linkedin?.profileName || 'Your Profile',
          },
        });
      } catch (e) {
        console.error('Failed to load connections', e);
      }
    };

    loadConnections();
  }, []);

  const platformsMeta: {
    id: PlatformKey;
    name: string;
    icon: string;
    help: string;
  }[] = [
      {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        help: 'Requires Business/Creator account linked to a Facebook Page.',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        icon: '🎥',
        help: 'Use the channel you want PostPilot to upload to.',
      },
      {
        id: 'twitter',
        name: 'Twitter/X',
        icon: '🐦',
        help: 'Authorize PostPilot to post tweets on your behalf.',
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        help: 'Post as your profile (company pages later).',
      },
    ];

  const handleConnect = (platform: PlatformKey) => {
    if (platform === 'youtube') {
      window.location.href = '/api/auth/youtube';
    } else if (platform === 'instagram') {
      window.location.href = '/api/auth/instagram';
    } else if (platform === 'twitter') {
      window.location.href = '/api/auth/twitter/oauth1';

    } else if (platform === 'linkedin') {
      window.location.href = '/api/auth/linkedin';
    }
  };

  const handleDisconnect = async (platform: PlatformKey) => {
    try {
      const res = await fetch(`/api/connections/${platform}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error('Failed to disconnect', data.error);
        return;
      }

      // Reload connections from Firestore
      const connRes = await fetch('/api/connections');
      const connData = await connRes.json();

      setConnections({
        instagram: {
          connected: !!connData.instagram,
          displayName: connData.instagram?.pageName || 'Instagram Business',
        },
        youtube: {
          connected: !!connData.youtube,
          displayName: connData.youtube?.channelName || 'YouTube',
        },
        twitter: {
          connected: !!connData.twitter,
          displayName: connData.twitter?.handle || '@yourhandle',
        },
        linkedin: {
          connected: !!connData.linkedin,
          displayName: connData.linkedin?.profileName || 'Your Profile',
        },
      });
    } catch (e) {
      console.error('Disconnect request failed', e);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="text-2xl">✨</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              PostPilot
            </h1>
          </Link>
          <Link
            href="/posts/create"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            + Create Post
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            Connected Accounts
          </h2>
          <p className="text-gray-600">
            Connect your social profiles so PostPilot can publish on your behalf.
          </p>
        </div>

        <div className="space-y-4">
          {platformsMeta.map((p) => {
            const conn = connections[p.id];
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm border p-5 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl mt-1">{p.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {p.name}
                      </h3>
                      {conn.connected && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Connected
                        </span>
                      )}
                    </div>
                    {conn.displayName && (
                      <p className="text-sm text-gray-700 mb-1">
                        Posting as{' '}
                        <span className="font-medium">
                          {conn.displayName}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{p.help}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {conn.connected ? (
                    <>
                      <button
                        onClick={() => handleDisconnect(p.id)}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Disconnect
                      </button>
                      <button
                        onClick={() => handleConnect(p.id)}
                        className="text-xs text-purple-600 hover:text-purple-800 underline"
                      >
                        Reconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(p.id)}
                      className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Connect {p.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
