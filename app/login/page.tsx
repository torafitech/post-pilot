'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, Zap } from 'lucide-react';

function mapAuthError(code?: string, fallback = 'Sign in failed.'): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/invalid-email':
      return 'That email looks invalid.';
    case 'auth/too-many-requests':
      return 'Too many attempts — try again in a few minutes.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/network-request-failed':
      return 'Network problem — check your connection and retry.';
    default:
      return fallback;
  }
}

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password required.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(mapAuthError(err?.code, err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotEmail.trim()) {
      setForgotMsg({ ok: false, text: 'Enter the email on your account.' });
      return;
    }
    setForgotBusy(true);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotMsg({
        ok: true,
        text: 'If an account exists, a reset link is on its way. Check your inbox + spam folder.',
      });
    } catch (err: any) {
      // Don't leak account existence — show same generic message on error.
      setForgotMsg({
        ok: true,
        text: 'If an account exists, a reset link is on its way. Check your inbox + spam folder.',
      });
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* subtle ambient gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(34,211,238,0.12),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/20">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-1.5">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm">Sign in to your StarlingPost account.</p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 backdrop-blur-sm rounded-2xl p-7 shadow-2xl">
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3.5 py-2.5 rounded-xl mb-5 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Email
              </label>
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/15 transition">
                <Mail size={15} className="text-gray-600 mr-2.5" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotOpen(true); setForgotEmail(email); setForgotMsg(null); }}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Forgot?
                </button>
              </div>
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/15 transition">
                <Lock size={15} className="text-gray-600 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-600 hover:text-gray-300 ml-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 px-5 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            New to StarlingPost?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot password modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setForgotOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold mb-1">Reset password</h2>
            <p className="text-gray-500 text-sm mb-4">
              We'll email you a secure link to set a new password.
            </p>

            <form onSubmit={handleForgot} className="space-y-3">
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-cyan-500/60 transition">
                <Mail size={15} className="text-gray-600 mr-2.5" />
                <input
                  type="email"
                  inputMode="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              {forgotMsg && (
                <div
                  className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-sm ${
                    forgotMsg.ok
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {forgotMsg.ok
                    ? <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
                    : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                  <span>{forgotMsg.text}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium"
                >
                  {forgotMsg?.ok ? 'Done' : 'Cancel'}
                </button>
                {!forgotMsg?.ok && (
                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {forgotBusy && <Loader2 size={14} className="animate-spin" />}
                    Send reset link
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
