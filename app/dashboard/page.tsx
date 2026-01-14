// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { SocialPost } from '@/types/post';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ConnectedAccount {
  id: string;
  platform: string; // e.g. "YouTube"
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

  // posts + loading state
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [syncingPosts, setSyncingPosts] = useState(false);
  // inside DashboardPage component, add this state near other useState:
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'all' | 'instagram' | 'twitter' | 'youtube'>('all');
  const filteredPosts = posts.filter((p) =>
    selectedPlatformFilter === 'all'
      ? true
      : p.platform?.toLowerCase() === selectedPlatformFilter,
  );
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
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchConnectedAccounts();
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, userProfile]);

  const fetchConnectedAccounts = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      const accounts: ConnectedAccount[] = [];

      if (docSnap.exists()) {
        const userData = docSnap.data() as any;
        const connectedAccountsList = userData.connectedAccounts || [];

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
      }

      setConnectedAccounts(accounts);
    } catch (error: any) {
      console.error('❌ Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // fetch posts for this user
  const fetchPosts = async () => {
    if (!user) return;
    try {
      setPostsLoading(true);
      const postsRef = collection(db, 'users', user.uid, 'posts');
      const q = query(postsRef, orderBy('publishedAt', 'desc'), limit(100));
      const snap = await getDocs(q);

      const list: SocialPost[] = [];
      snap.forEach((docSnap) =>
        list.push({ id: docSnap.id, ...(docSnap.data() as any) }),
      );
      console.log('[DASHBOARD] Loaded posts', list);
      setPosts(list);
    } catch (error: any) {
      console.error('❌ Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // trigger sync metrics API
  const handleSyncPosts = async () => {
    if (!user) return;
    try {
      setSyncingPosts(true);
      const res = await fetch('/api/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!data.success) {
        alert('Error syncing posts: ' + (data.error || 'Unknown error'));
      } else {
        await fetchPosts();
      }
    } catch (error: any) {
      console.error('❌ Error syncing posts:', error);
      alert('Error syncing posts: ' + error.message);
    } finally {
      setSyncingPosts(false);
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
    if (!user) return;

    try {
      const accountToRemove = connectedAccounts.find((acc) => acc.id === accountId);
      if (!accountToRemove) return;

      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const list = data.connectedAccounts || [];
        const filtered = list.filter((item: any) => item.id !== accountToRemove.id);

        await updateDoc(userDocRef, {
          connectedAccounts: filtered,
        });
      }

      const updatedAccounts = connectedAccounts.filter((acc) => acc.id !== accountId);
      setConnectedAccounts(updatedAccounts);
    } catch (error: any) {
      console.error('❌ Error disconnecting account:', error);
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
      await logout();
      router.push('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // compute aggregate BEFORE any early returns, no hooks here
  const aggregate = (() => {
    let reach = 0;
    let views = 0;
    let likes = 0;
    let comments = 0;

    posts.forEach((p) => {
      reach += p.metrics?.reach || 0;
      views += p.metrics?.views || 0;
      likes += p.metrics?.likes || 0;
      comments += p.metrics?.comments || 0;
    });

    return { reach, views, likes, comments };
  })();

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

  if (!user) return null;

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
            <Link
              href="/settings/connections"
              className="text-gray-300 hover:text-white transition"
            >
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
            Manage your social media accounts, track performance, and create amazing content.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatCard icon="📱" label="Connected Accounts" value={connectedAccounts.length} />
          <StatCard icon="📝" label="Posts (tracked)" value={posts.length} />
          <StatCard icon="📊" label="Total Reach" value={aggregate.reach} />
          <StatCard icon="👀" label="Total Views" value={aggregate.views} />
        </div>

        {/* AI Enhancement Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">✨ AI Caption Enhancement</h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-gray-400 mb-4">
              Use AI to enhance your captions and make them more engaging for your chosen
              platform.
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
              <p className="text-xs text-gray-500 mt-2">
                {enhancedText.length} characters
              </p>
            </div>

            <button
              onClick={handleEnhanceCaption}
              disabled={enhancingCaption || !enhancedText.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition"
            >
              {enhancingCaption ? '🔄 Enhancing...' : '✨ Enhance Caption'}
            </button>

            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm text-purple-300">
              💡 Tip: AI enhancement will optimize your caption for engagement, add relevant
              emojis and hashtags based on the platform.
            </div>
          </div>
        </div>

        {/* Posts & Performance */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Posts & performance</h2>
              <p className="text-gray-500 text-sm">
                View metrics fetched directly from each social platform.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSyncPosts}
                disabled={syncingPosts}
                className="bg-gray-900 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 transition"
              >
                {syncingPosts ? '🔄 Syncing...' : '🔁 Sync metrics'}
              </button>
              <Link
                href="/posts/create"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-4 py-2 rounded-lg font-semibold text-sm"
              >
                + New Post
              </Link>
            </div>
          </div>

          {/* Platform filter tabs */}
          <div className="flex gap-2 mb-4 text-sm">
            {[
              { key: 'all', label: 'All' },
              { key: 'instagram', label: 'Instagram' },
              { key: 'twitter', label: 'Twitter / X' },
              { key: 'youtube', label: 'YouTube' },
            ].map((tab) => {
              const active = selectedPlatformFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPlatformFilter(tab.key as any)}
                  className={[
                    'px-4 py-2 rounded-full border text-xs md:text-sm font-semibold transition',
                    active
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-cyan-500/60',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {postsLoading ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
              Loading posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
              No posts for this filter yet. Create a post and sync metrics.
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-950/60 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Post</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Reach</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Likes</th>
                    <th className="px-4 py-3">Comments</th>
                    <th className="px-4 py-3">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-gray-800 hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-gray-100 truncate">{p.caption}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300 capitalize">
                        {p.platform}
                      </td>
                      <td className="px-4 py-3 text-center text-cyan-300">
                        {p.metrics?.reach ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.metrics?.views ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.metrics?.likes ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.metrics?.comments ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {p.publishedAt?.toDate
                          ? p.publishedAt.toDate().toLocaleDateString()
                          : p.publishedAt
                            ? new Date(p.publishedAt as any).toLocaleDateString()
                            : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Engagement snapshot still uses aggregate (you already have it) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Engagement snapshot</h3>
            <div className="grid md:grid-cols-4 gap-4 text-center text-sm">
              <MiniStat label="Reach" value={aggregate.reach} />
              <MiniStat label="Views" value={aggregate.views} />
              <MiniStat label="Likes" value={aggregate.likes} />
              <MiniStat label="Comments" value={aggregate.comments} />
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
                        if (
                          confirm(
                            `Are you sure you want to disconnect ${account.platform}?`,
                          )
                        ) {
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
              Note: In production, this will redirect to the platform&apos;s OAuth login.
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

/* Small components */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
