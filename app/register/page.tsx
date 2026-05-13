'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegisterPage() {
  const [displayName,     setDisplayName]     = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [mobile,          setMobile]          = useState<string | undefined>();

  const { register } = useAuth();
  const router       = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!displayName.trim()) { setError('Display name is required'); setLoading(false); return; }
    if (!mobile)             { setError('Mobile number is required'); setLoading(false); return; }
    if (!email.trim())       { setError('Email is required');         setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }

    try {
      await register(email, password, displayName, mobile);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `
    w-full bg-transparent border-0 border-b border-stone-800
    focus:border-[#d4ff3a] focus:outline-none focus:ring-0
    text-stone-100 placeholder-stone-700 text-sm py-3
    transition-colors duration-200
  `;

  const labelCls = 'block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-3';

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain relative flex items-center justify-center px-6 py-20">

      {/* Phone input dark overrides */}
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

      <div className="w-full max-w-[440px]">

        {/* Wordmark */}
        <div className="mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">
            StarlingPost
          </p>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Start your free trial.
          </h1>
          <p className="mt-3 text-sm text-stone-400">
            14 days full access. No credit card required.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 mb-8 border border-[#ff5e3a]/30 bg-[#ff5e3a]/5 px-4 py-3">
            <span className="w-1 h-1 mt-2 rounded-full bg-[#ff5e3a] flex-shrink-0" />
            <p className="text-sm text-[#ff5e3a]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          <div>
            <label className={labelCls}>Full name</label>
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
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-700 mt-2">
              Stored in international format
            </p>
          </div>

          <div>
            <label className={labelCls}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="
                w-full bg-[#d4ff3a] text-[#0a0a0b]
                font-mono text-[10px] uppercase tracking-[0.25em] font-bold
                py-4 hover:bg-[#bff020]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {loading ? 'Creating account…' : 'Start free trial →'}
            </button>
          </div>
        </form>

        {/* Three pillars */}
        <div className="mt-10 border border-stone-800 grid grid-cols-3 divide-x divide-stone-800">
          {[
            { n: '14',   label: 'Day trial'  },
            { n: '6',    label: 'Platforms'  },
            { n: '24/7', label: 'Auto-reply' },
          ].map(item => (
            <div key={item.label} className="py-4 text-center">
              <div
                className="font-display italic text-stone-100 tabular-nums leading-none mb-1"
                style={{ fontSize: '1.5rem', fontVariationSettings: '"opsz" 80' }}
              >
                {item.n}
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-600">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-stone-800 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            Have an account?
          </p>
          <Link
            href="/login"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a] hover:text-[#bff020] transition-colors"
          >
            Sign in →
          </Link>
        </div>

      </div>
    </div>
  );
}
