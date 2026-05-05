'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import {
  AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon, Zap,
} from 'lucide-react';

function mapAuthError(code?: string, fallback = 'Sign up failed.'): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/invalid-email':
      return 'That email looks invalid.';
    case 'auth/weak-password':
      return 'Password is too weak — pick something stronger.';
    case 'auth/network-request-failed':
      return 'Network problem — check your connection and retry.';
    default:
      return fallback;
  }
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim(), mobile || '');
      router.push('/dashboard');
    } catch (err: any) {
      setError(mapAuthError(err?.code, err?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.12),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-4 shadow-lg shadow-purple-500/20">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-1.5">Create your account</h1>
          <p className="text-gray-500 text-sm">Free during beta — no credit card needed.</p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 backdrop-blur-sm rounded-2xl p-7 shadow-2xl">
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3.5 py-2.5 rounded-xl mb-5 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name">
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/15 transition">
                <UserIcon size={15} className="text-gray-600 mr-2.5" />
                <input
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
            </Field>

            <Field label="Email">
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/15 transition">
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
            </Field>

            <Field label={<>Mobile <span className="font-normal text-gray-600 normal-case">(optional)</span></>}>
              <div className="phone-input-dark bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 focus-within:border-purple-500/60 transition">
                <PhoneInput
                  international
                  defaultCountry="IN"
                  value={mobile}
                  onChange={setMobile}
                  placeholder="Phone (optional)"
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/15 transition">
                <Lock size={15} className="text-gray-600 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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
            </Field>

            <Field label="Confirm password">
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-4 focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/15 transition">
                <Lock size={15} className="text-gray-600 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 disabled:opacity-60 px-5 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-gray-500 hover:text-gray-300">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-gray-500 hover:text-gray-300">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
