'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [mobile, setMobile]           = useState<string | undefined>();
  const [saving, setSaving]           = useState(false);
  const [saved,  setSaved]            = useState(false);
  const [error,  setError]            = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]); // eslint-disable-line

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setMobile(userProfile.mobile || undefined);
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) { setError('Display name is required'); return; }
    setError('');
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        mobile: mobile || '',
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
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

  const joinDate = userProfile?.createdAt
    ? userProfile.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const initial = (userProfile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain">
      <style>{`
        .phone-editorial .PhoneInput { display: flex; gap: 12px; align-items: center; }
        .phone-editorial .PhoneInputCountry { display: flex; align-items: center; gap: 6px; }
        .phone-editorial .PhoneInputCountrySelect {
          background: transparent; border: none; outline: none;
          color: #a8a29e; font-size: 12px; cursor: pointer;
        }
        .phone-editorial .PhoneInputCountrySelectArrow { color: #57534e; }
        .phone-editorial .PhoneInputInput {
          flex: 1; background: transparent; border: none; outline: none;
          color: #fafaf9; font-size: 14px; padding: 12px 0;
        }
        .phone-editorial .PhoneInputInput::placeholder { color: #44403c; }
      `}</style>

      <div className="max-w-[680px] mx-auto px-6 md:px-10 py-16">

        {/* Header */}
        <div className="mb-10 pb-8 border-b border-stone-800">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">Account</p>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Your profile
          </h1>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            Member since {joinDate}
          </p>
        </div>

        {/* Avatar + plan */}
        <div className="mb-10 flex items-center gap-5 p-5 border border-stone-800">
          <div className="w-14 h-14 bg-[#f4f1ea] text-[#0a0a0b] flex items-center justify-center font-display italic font-bold flex-shrink-0"
            style={{ fontSize: '1.75rem', fontVariationSettings: '"opsz" 80' }}>
            {initial}
          </div>
          <div>
            <div className="font-display italic text-xl text-stone-100">
              {userProfile?.displayName || 'Your name'}
            </div>
            <div className="font-mono text-[10px] text-stone-500 truncate mt-0.5 uppercase tracking-[0.1em]">
              {user.email}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 capitalize">
                {userProfile?.plan || 'freemium'}
              </span>
              <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 border ${
                userProfile?.planStatus === 'active'
                  ? 'border-[#d4ff3a]/30 text-[#d4ff3a]'
                  : 'border-stone-700 text-stone-500'
              }`}>
                {userProfile?.planStatus || 'active'}
              </span>
            </div>
          </div>
          <Link
            href="/billing"
            className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#d4ff3a] transition-colors flex-shrink-0"
          >
            Manage plan →
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 mb-8 border border-[#ff5e3a]/30 bg-[#ff5e3a]/5 px-4 py-3">
            <span className="w-1 h-1 mt-2 rounded-full bg-[#ff5e3a] flex-shrink-0" />
            <p className="text-sm text-[#ff5e3a]">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-8">

          <div>
            <label className={labelCls}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Mobile number</label>
            <div className="phone-editorial border-b border-stone-800 focus-within:border-[#d4ff3a] transition-colors duration-200">
              <PhoneInput
                international
                defaultCountry="IN"
                value={mobile}
                onChange={setMobile}
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email address</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className={`${inputCls} opacity-40 cursor-not-allowed`}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 mt-2">
              To change email — contact support
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="
                w-full bg-[#d4ff3a] text-[#0a0a0b]
                font-mono text-[10px] uppercase tracking-[0.25em] font-bold
                py-4 hover:bg-[#bff020]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes →'}
            </button>
          </div>

        </form>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex items-center justify-between">
          <Link href="/settings" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            Settings →
          </Link>
          <Link href="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            ← Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
