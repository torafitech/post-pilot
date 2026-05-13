'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuth();
  const router    = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) { setError('Email is required'); setLoading(false); return; }
    if (!password)     { setError('Password is required'); setLoading(false); return; }

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found')   setError('No account found with this email');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password');
      else setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain relative flex items-center justify-center px-6 py-20">
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
            Sign in
          </h1>
          <p className="mt-3 text-sm text-stone-400">
            Welcome back to your studio.
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
          {/* Email */}
          <div className="group">
            <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="
                w-full bg-transparent border-0 border-b border-stone-800
                focus:border-[#d4ff3a] focus:outline-none focus:ring-0
                text-stone-100 placeholder-stone-700 text-sm py-3
                transition-colors duration-200
              "
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="
                w-full bg-transparent border-0 border-b border-stone-800
                focus:border-[#d4ff3a] focus:outline-none focus:ring-0
                text-stone-100 placeholder-stone-700 text-sm py-3
                transition-colors duration-200
              "
            />
          </div>

          {/* Submit */}
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
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-stone-800 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            No account?
          </p>
          <Link
            href="/register"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a] hover:text-[#bff020] transition-colors"
          >
            Create one →
          </Link>
        </div>

      </div>
    </div>
  );
}
