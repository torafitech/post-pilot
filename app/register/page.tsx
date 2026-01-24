'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState<string | undefined>();

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!displayName.trim()) {
      setError('Display name is required');
      setLoading(false);
      return;
    }
    if (!mobile) {
      setError('Mobile number is required');
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(email, password, displayName, mobile);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* soft background gradient like dashboard */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-cyan-100/40 via-white to-purple-100/40" />

      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-2xl text-white shadow-sm">
            🚀
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1">
            StarlingPost
          </h1>
          <p className="text-slate-500 text-sm">Join thousands of creators</p>
        </div>

        {/* Form Card (glass / light like dashboard cards) */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">Create Account</h2>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-cyan-500 focus:ring-0 focus:outline-none transition text-slate-900 placeholder-slate-400 text-sm"
              />
            </div>

            {/* Mobile with react-phone-number-input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Mobile Number
              </label>
              <div className="px-3 py-2 rounded-lg bg-white border border-slate-200 focus-within:border-cyan-500 transition">
                <PhoneInput
                  international
                  defaultCountry="IN"
                  value={mobile}
                  onChange={setMobile}
                  className="text-sm text-slate-900"
                  placeholder="Enter mobile number"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Stored in international format with country code.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-cyan-500 focus:ring-0 focus:outline-none transition text-slate-900 placeholder-slate-400 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-cyan-500 focus:ring-0 focus:outline-none transition text-slate-900 placeholder-slate-400 text-sm"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 focus:border-cyan-500 focus:ring-0 focus:outline-none transition text-slate-900 placeholder-slate-400 text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold text-white text-sm shadow-sm transition mt-4"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-slate-500 mt-6 text-sm">
            Already have an account{' '}
            <Link
              href="/login"
              className="text-cyan-600 hover:text-cyan-500 font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Benefits (light version) */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-2xl mb-2">✨</div>
            <p className="text-slate-500">AI-Powered Content</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📊</div>
            <p className="text-slate-500">Smart Analytics</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-slate-500">Auto Posting</p>
          </div>
        </div>
      </div>
    </div>
  );
}
