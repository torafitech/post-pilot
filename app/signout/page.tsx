'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignOutPage() {
  const { logout } = useAuth();
  const router     = useRouter();

  useEffect(() => {
    logout()
      .then(() => router.push('/'))
      .catch(() => router.push('/'));
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">StarlingPost</p>
        <p
          className="font-display italic text-stone-400"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontVariationSettings: '"opsz" 144' }}
        >
          Signing out…
        </p>
      </div>
    </div>
  );
}
