// components/Toast.tsx
// Lightweight in-app toast system — replaces alert() everywhere.
//
// Usage:
//   1. Wrap the app once in <ToastProvider> (already done in
//      RootLayout via AuthProvider parent — see app/layout.tsx).
//   2. Anywhere inside, call:
//        const { toast } = useToast();
//        toast.success('Saved');
//        toast.error('Could not save', 'Optional details');
//        toast.info('Heads up');
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  /** ms; defaults to 5s for success/info and 8s for error. */
  duration?: number;
}

interface Ctx {
  toast: {
    success: (title: string, description?: string, duration?: number) => string;
    error:   (title: string, description?: string, duration?: number) => string;
    info:    (title: string, description?: string, duration?: number) => string;
    dismiss: (id: string) => void;
  };
}

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string, duration?: number) => {
      const id = Math.random().toString(36).slice(2);
      setItems((s) => [...s, { id, kind, title, description, duration }]);
      return id;
    },
    [],
  );

  const value: Ctx = {
    toast: {
      success: (t, d, ms) => push('success', t, d, ms),
      error:   (t, d, ms) => push('error',   t, d, ms),
      info:    (t, d, ms) => push('info',    t, d, ms),
      dismiss,
    },
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end justify-end gap-2 p-4 sm:p-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const v = useContext(ToastCtx);
  if (!v) throw new Error('useToast must be used inside <ToastProvider>');
  return v;
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const fallbackDuration = item.kind === 'error' ? 8000 : 5000;
  const duration = item.duration ?? fallbackDuration;

  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const palette = {
    success: { ring: 'border-emerald-500/40', bg: 'bg-emerald-500/10', icon: <CheckCircle size={16} className="text-emerald-400" /> },
    error:   { ring: 'border-red-500/40',     bg: 'bg-red-500/10',     icon: <AlertCircle size={16} className="text-red-400" /> },
    info:    { ring: 'border-cyan-500/40',    bg: 'bg-cyan-500/10',    icon: <Info size={16} className="text-cyan-400" /> },
  }[item.kind];

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm bg-gray-900 border ${palette.ring} rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 backdrop-blur-sm animate-[toastSlide_.18s_ease-out]`}
      style={{ animation: 'toastSlide .18s ease-out' }}
    >
      <div className={`p-1.5 rounded-lg ${palette.bg} flex-shrink-0`}>{palette.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug whitespace-pre-line">
            {item.description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-gray-600 hover:text-gray-300 transition-colors -mr-1 -mt-1 p-1"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
