// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ConnectedAccount {
  id: string;
  platform: string;      // e.g. "YouTube"
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  connectedAt: Date;
}

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [enhancingCaption, setEnhancingCaption] = useState(false);
  const [enhancedText, setEnhancedText] = useState('');

  const platforms = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Twitter/X',
    'LinkedIn',
    'Facebook',
    'Pinterest',
  ];

  // Check authentication and fetch data
  useEffect(() => {
    console.log('🔍 DashboardPage: useEffect running, authLoading:', authLoading);
    if (authLoading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    if (!user) {
      console.log('❌ No user found, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('✅ User authenticated:', {
      uid: user.uid,
      email: user.email,
      displayName: userProfile?.displayName,
    });

    fetchConnectedAccounts();
  }, [user, authLoading, router, userProfile]);

  const fetchConnectedAccounts = async () => {
    if (!user) {
      console.log('❌ fetchConnectedAccounts: No user');
      return;
    }

    try {
      console.log('🔄 Fetching connected accounts for user:', user.uid);

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      const accounts: ConnectedAccount[] = [];

      if (docSnap.exists()) {
        const userData = docSnap.data() as any;
        const connectedAccountsList = userData.connectedAccounts || [];

        console.log('✅ Found user document with accounts:', {
          count: connectedAccountsList.length,
          accounts: connectedAccountsList,
        });

        connectedAccountsList.forEach((account: any) => {
          const platformKey = account.platform || 'account';
          const platformLabel =
            platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

          let connectedAt: Date = new Date();
          if (account.connectedAt?.toDate) {
            connectedAt = account.connectedAt.toDate();
          } else if (account.connectedAt) {
            connectedAt = new Date(account.connectedAt);
          }

          accounts.push({
            id: account.id,
            platform: platformLabel,
            accountName: account.accountName || account.accountLabel || platformLabel,
            accessToken: account.accessToken || '',
            refreshToken: account.refreshToken ?? null,
            connectedAt,
          });
        });
      } else {
        console.log('📝 User document does not exist yet');
      }

      console.log('✅ Processed connected accounts:', {
        count: accounts.length,
        accounts: accounts.map((a) => ({
          id: a.id,
          platform: a.platform,
          accountName: a.accountName,
        })),
      });

      setConnectedAccounts(accounts);
    } catch (error: any) {
      console.error('❌ Error fetching accounts:', {
        message: error.message,
        code: error.code,
        fullError: error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async () => {
    if (!selectedPlatform) {
      alert('Please select a platform');
      return;
    }
    if (!user) {
      alert('You must be logged in');
      return;
    }

    try {
      setShowModal(false);

      if (selectedPlatform === 'youtube') {
        window.location.href = `/api/auth/youtube?uid=${encodeURIComponent(
          user.uid,
        )}`;
        return;
      }

      if (selectedPlatform === 'twitter' || selectedPlatform === 'twitter/x') {
        window.location.href = `/api/auth/twitter/oauth1?uid=${encodeURIComponent(
          user.uid,
        )}`;
        return;
      }

      if (selectedPlatform === 'instagram') {
        if (!user) {
          alert('You must be logged in');
          return;
        }

        window.location.href = `/api/auth/instagram?uid=${encodeURIComponent(
          user.uid,
        )}`;
        return;
      }



      const oauthRoutes: { [key: string]: string } = {
        instagram: '/api/auth/instagram',
        youtube: '/api/auth/youtube',
        twitter: '/api/auth/twitter/oauth1',
        'twitter/x': '/api/auth/twitter/oauth1',
        linkedin: '/api/auth/linkedin',
        tiktok: '/api/auth/tiktok',
        facebook: '/api/auth/facebook',
        pinterest: '/api/auth/pinterest',
      };

      const oauthRoute = oauthRoutes[selectedPlatform];
      if (!oauthRoute) {
        alert(`OAuth not yet configured for ${selectedPlatform}`);
        return;
      }

      window.location.href = oauthRoute;
    } catch (error: any) {
      console.error('Error initiating OAuth:', error);
      alert(`Error: ${error.message}`);
    }
  };



  const handleDisconnectAccount = async (accountId: string) => {
    if (!user) {
      console.log('❌ No user to disconnect');
      return;
    }

    try {
      console.log('🔌 Attempting to disconnect account:', {
        accountId,
        userId: user.uid,
      });

      const accountToRemove = connectedAccounts.find((acc) => acc.id === accountId);
      console.log('🗑️ Removing account:', accountToRemove);

      if (!accountToRemove) {
        console.log('⚠️ Account not found in state');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const list = data.connectedAccounts || [];

        // Filter out the account with this id
        const filtered = list.filter((item: any) => item.id !== accountToRemove.id);

        await updateDoc(userDocRef, {
          connectedAccounts: filtered,
        });

        console.log('✅ Firestore updated, account removed from array');
      }

      // Update local state
      const updatedAccounts = connectedAccounts.filter((acc) => acc.id !== accountId);
      setConnectedAccounts(updatedAccounts);

      console.log('✅ Account disconnected successfully');
    } catch (error: any) {
      console.error('❌ Error disconnecting account:', {
        message: error.message,
        code: error.code,
        fullError: error,
      });
      alert(`❌ Error disconnecting account: ${error.message}`);
    }
  };

  const handleEnhanceCaption = async () => {
    if (!enhancedText.trim()) {
      alert('Please enter text to enhance');
      return;
    }

    try {
      setEnhancingCaption(true);
      console.log('🤖 Calling AI enhance API with:', {
        text: enhancedText,
        platform: selectedPlatform,
      });

      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: enhancedText,
          platform: selectedPlatform,
          tone: 'engaging',
          contentType: 'post',
        }),
      });

      const data = await response.json();
      console.log('✅ AI enhance response:', data);

      if (data.success && data.enhancedCaption) {
        alert('✨ Enhanced Caption:\n\n' + data.enhancedCaption);
      } else {
        alert('❌ Error: ' + (data.error || 'Could not enhance caption'));
      }
    } catch (error: any) {
      console.error('❌ Error calling AI enhance API:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setEnhancingCaption(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('👋 Logging out user:', user?.email);
      await logout();
      console.log('✅ Logout successful, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🚀</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 sticky top-0 z-40 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🚀</div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              PostPilot
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/posts/create" className="text-gray-300 hover:text-white transition">
              Create Post
            </Link>
            <Link href="/settings/connections" className="text-gray-300 hover:text-white transition">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              {userProfile?.displayName}
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your social media accounts and create amazing content
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl mb-2">📱</div>
            <p className="text-gray-400 mb-2">Connected Accounts</p>
            <p className="text-4xl font-bold">{connectedAccounts.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-gray-400 mb-2">Posts Scheduled</p>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-400 mb-2">Total Followers</p>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-400 mb-2">Engagement Rate</p>
            <p className="text-4xl font-bold">0%</p>
          </div>
        </div>

        {/* AI Enhancement Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">✨ AI Caption Enhancement</h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-gray-400 mb-4">
              Use AI to enhance your captions and make them more engaging for your chosen platform.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none transition text-white"
              >
                {platforms.map((p) => (
                  <option key={p} value={p.toLowerCase()}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Your Caption</label>
              <textarea
                value={enhancedText}
                onChange={(e) => setEnhancedText(e.target.value)}
                placeholder="Enter your caption here..."
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none transition text-white h-32 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">{enhancedText.length} characters</p>
            </div>

            <button
              onClick={handleEnhanceCaption}
              disabled={enhancingCaption || !enhancedText.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition"
            >
              {enhancingCaption ? '🔄 Enhancing...' : '✨ Enhance Caption'}
            </button>

            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm text-purple-300">
              💡 Tip: AI enhancement will optimize your caption for engagement, add relevant emojis and hashtags based on the platform.
            </div>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Connected Accounts</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-6 py-2 rounded-lg font-semibold transition"
            >
              + Connect Account
            </button>
          </div>

          {connectedAccounts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{account.platform}</h3>
                      <p className="text-gray-400">{account.accountName}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to disconnect ${account.platform}?`)) {
                          handleDisconnectAccount(account.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition text-2xl"
                      title="Disconnect account"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    <div>
                      🔗 Connected on{' '}
                      {account.connectedAt instanceof Date
                        ? account.connectedAt.toLocaleDateString()
                        : new Date(account.connectedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">ID: {account.id}</div>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-4 py-2 rounded-lg font-semibold transition text-sm">
                      📊 View Analytics
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Disconnect ${account.platform}?`)) {
                          handleDisconnectAccount(account.id);
                        }
                      }}
                      className="w-full border border-red-500 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      🔌 Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-2xl font-bold mb-2">No Connected Accounts</h3>
              <p className="text-gray-400 mb-6">
                Connect your social media accounts to start scheduling posts
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-8 py-3 rounded-lg font-bold transition"
              >
                Connect Your First Account
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Recent Activity</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-400">No posts yet. Start creating amazing content!</p>
            <Link
              href="/posts/create"
              className="inline-block mt-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-8 py-3 rounded-lg font-bold transition"
            >
              Create Your First Post
            </Link>
          </div>
        </div>
      </div>

      {/* Connect Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Connect Account</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-400 mb-6">Select a platform to connect</p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none transition text-white"
              >
                {platforms.map((p) => (
                  <option key={p} value={p.toLowerCase()}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-sm text-blue-300">
              Note: In production, this will redirect to the platform&apos;s OAuth login
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-3 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectAccount}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-4 py-3 rounded-lg font-semibold transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
