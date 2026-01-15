'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface AdminUserRow {
  id: string;
  email?: string;
  displayName?: string;
  plan?: string;
  planStatus?: string;
  connectedAccountsCount: number;
  platforms: string[];
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // simple admin gate
  const ADMIN_UID = 'YOUR_ADMIN_UID_HERE';

  useEffect(() => {
    if (!user) return;
    if (user.uid !== ADMIN_UID) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list: AdminUserRow[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const connected = data.connectedAccounts || [];
          list.push({
            id: docSnap.id,
            email: data.email,
            displayName: data.displayName,
            plan: data.plan || 'free',
            planStatus: data.planStatus || 'none',
            connectedAccountsCount: connected.length,
            platforms: connected.map((a: any) => a.platform).filter(Boolean),
          });
        });
        setRows(list);
      } catch (e) {
        console.error('Admin load error', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Not authorized.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading users...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin – Users & Plans</h1>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Plan</th>
                <th className="px-4 py-2 text-left">Connected Accounts</th>
                <th className="px-4 py-2 text-left">Platforms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {u.displayName || '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {u.email || u.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-700">
                      {u.plan} ({u.planStatus})
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {u.connectedAccountsCount}
                  </td>
                  <td className="px-4 py-2">
                    {u.platforms.join(', ') || '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
