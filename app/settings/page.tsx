'use client';

import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [pwdSaving,   setPwdSaving]   = useState(false);
  const [pwdMsg,      setPwdMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]); // eslint-disable-line

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setPwdMsg(null);
    if (newPwd.length < 6) { setPwdMsg({ type: 'err', text: 'New password must be at least 6 characters' }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'err', text: 'Passwords do not match' }); return; }
    setPwdSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      setPwdMsg({ type: 'ok', text: 'Password updated successfully' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      const msg =
        err.code === 'auth/wrong-password' ? 'Current password is incorrect' :
        err.code === 'auth/invalid-credential' ? 'Current password is incorrect' :
        err.message || 'Failed to update password';
      setPwdMsg({ type: 'err', text: msg });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirm !== 'DELETE') { setDeleteError('Type DELETE to confirm'); return; }
    setDeleting(true);
    setDeleteError('');
    try {
      const subCollections = ['linkMeRules', 'autoReplyTemplates', 'linkMeReplies', 'autoReplyReplies', 'posts'];
      await Promise.allSettled(subCollections.map(async col => {
        const snap = await getDocs(collection(db, 'users', user.uid, col));
        await Promise.allSettled(snap.docs.map(d => deleteDoc(d.ref)));
      }));
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      await logout();
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Re-login required. Sign out and back in, then try again.');
      } else {
        setDeleteError(err.message || 'Failed to delete account');
      }
      setDeleting(false);
    }
  };

  if (loading || !user) return null;

  const inputCls = `
    w-full bg-transparent border-0 border-b border-stone-800
    focus:border-[#d4ff3a] focus:outline-none focus:ring-0
    text-stone-100 placeholder-stone-700 text-sm py-3
    transition-colors duration-200
  `;
  const labelCls = 'block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-3';

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain">
      <div className="max-w-[680px] mx-auto px-6 md:px-10 py-16">

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-stone-800">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">Account</p>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Settings
          </h1>
        </div>

        {/* ── Security ────────────────────────────────────────────────────────── */}
        <section className="mb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Security</p>
          <h2 className="font-display italic text-2xl text-stone-100 mb-8">Change password</h2>

          {pwdMsg && (
            <div className={`flex items-start gap-3 mb-6 border px-4 py-3 ${
              pwdMsg.type === 'ok'
                ? 'border-[#d4ff3a]/30 bg-[#d4ff3a]/5'
                : 'border-[#ff5e3a]/30 bg-[#ff5e3a]/5'
            }`}>
              <span className={`w-1 h-1 mt-2 rounded-full flex-shrink-0 ${pwdMsg.type === 'ok' ? 'bg-[#d4ff3a]' : 'bg-[#ff5e3a]'}`} />
              <p className={`text-sm ${pwdMsg.type === 'ok' ? 'text-[#d4ff3a]' : 'text-[#ff5e3a]'}`}>{pwdMsg.text}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-7">
            <div>
              <label className={labelCls}>Current password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>New password</label>
              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
              className="
                w-full bg-[#d4ff3a] text-[#0a0a0b]
                font-mono text-[10px] uppercase tracking-[0.25em] font-bold
                py-4 hover:bg-[#bff020]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {pwdSaving ? 'Updating…' : 'Update password →'}
            </button>
          </form>
        </section>

        {/* ── Preferences ─────────────────────────────────────────────────────── */}
        <section className="mb-14 pt-10 border-t border-stone-800">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Preferences</p>
          <h2 className="font-display italic text-2xl text-stone-100 mb-6">Timezone</h2>
          <p className="font-mono text-[10px] text-stone-600 uppercase tracking-[0.15em] leading-relaxed mb-5">
            Used for post scheduling. Inferred from your browser.
          </p>
          <div className="border border-stone-800 px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-stone-300">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600 border border-stone-800 px-2 py-0.5">
              Auto
            </span>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 mt-2">
            Manual timezone override — coming soon
          </p>
        </section>

        {/* ── Danger zone ─────────────────────────────────────────────────────── */}
        <section className="pt-10 border-t border-[#ff5e3a]/20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff5e3a]/50 mb-2">Danger zone</p>
          <h2 className="font-display italic text-2xl text-stone-100 mb-3">Delete account</h2>
          <p className="font-mono text-[10px] text-stone-600 uppercase tracking-[0.15em] leading-relaxed mb-8">
            Permanently deletes your account, posts, and all automation data.
            This cannot be undone.
          </p>

          {deleteError && (
            <div className="flex items-start gap-3 mb-6 border border-[#ff5e3a]/30 bg-[#ff5e3a]/5 px-4 py-3">
              <span className="w-1 h-1 mt-2 rounded-full bg-[#ff5e3a] flex-shrink-0" />
              <p className="text-sm text-[#ff5e3a]">{deleteError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#ff5e3a]/50 mb-3">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="
                  w-full bg-transparent border-0 border-b border-[#ff5e3a]/20
                  focus:border-[#ff5e3a] focus:outline-none focus:ring-0
                  text-stone-100 placeholder-stone-800 text-sm py-3
                  transition-colors
                "
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== 'DELETE'}
              className="
                w-full border border-[#ff5e3a]/40 text-[#ff5e3a]
                font-mono text-[10px] uppercase tracking-[0.25em]
                py-4 hover:bg-[#ff5e3a]/10
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {deleting ? 'Deleting account…' : 'Delete my account'}
            </button>
          </div>
        </section>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex items-center justify-between">
          <Link href="/profile" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            ← Profile
          </Link>
          <Link href="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            Dashboard →
          </Link>
        </div>

      </div>
    </div>
  );
}
