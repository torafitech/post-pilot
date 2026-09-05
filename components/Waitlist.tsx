'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BUSINESS_TYPES,
  CONFIRMATION_COPY,
  CTA_LABEL,
  LAUNCH_PRICING,
} from '@/lib/launch';
import { captureUtmParams, trackLead, trackWaitlistOpen } from '@/lib/tracking';

// ─── Context ──────────────────────────────────────────────────────────────────

const WaitlistContext = createContext<{ open: (source: string) => void } | null>(null);

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error('useWaitlist must be used inside <WaitlistProvider>');
  return ctx;
}

export function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('unknown');

  // Persist UTMs on first view — the query string is gone by the time most
  // visitors actually convert.
  useEffect(() => {
    captureUtmParams();
  }, []);

  const open = useCallback((from: string) => {
    setSource(from);
    setIsOpen(true);
    trackWaitlistOpen();
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <WaitlistContext.Provider value={value}>
      {children}
      <WaitlistModal isOpen={isOpen} onClose={() => setIsOpen(false)} source={source} />
    </WaitlistContext.Provider>
  );
}

// ─── CTA button ───────────────────────────────────────────────────────────────

export function WaitlistButton({
  source,
  label = CTA_LABEL,
  variant = 'primary',
  className = '',
}: {
  source: string;
  label?: string;
  variant?: 'primary' | 'ghost';
  className?: string;
}) {
  const { open } = useWaitlist();
  return (
    <button
      type="button"
      onClick={() => open(source)}
      className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-6 py-4 sm:py-3.5 text-sm font-medium tracking-tight transition-colors ${
        variant === 'primary'
          ? 'bg-[var(--citron)] text-black hover:bg-[#e6ff5e]'
          : 'border border-white/15 text-white hover:bg-white/5'
      } ${className}`}
    >
      {label}
      <ArrowRight size={16} className="shrink-0" />
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function WaitlistModal({
  isOpen,
  onClose,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  source: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => nameRef.current?.focus(), 120);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [isOpen, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'saving') return;
    setError(null);
    setStatus('saving');

    const utmParams = captureUtmParams();

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          businessType,
          ...utmParams,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          source,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.');
        setStatus('idle');
        return;
      }

      trackLead({ value: LAUNCH_PRICING.foundingPrice, currency: 'INR', utm: utmParams });
      setStatus('done');
    } catch {
      setError('Network error. Check your connection and try again.');
      setStatus('idle');
    }
  };

  const close = () => {
    onClose();
    // Reset only after the exit animation so the user doesn't see fields clear.
    setTimeout(() => {
      if (status === 'done') {
        setName('');
        setEmail('');
        setBusinessType('');
        setStatus('idle');
      }
      setError(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-heading"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.32, ease: [0.21, 1, 0.32, 1] }}
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[var(--ink)] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 grain"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {status === 'done' ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--citron)]/15 border border-[var(--citron)]/40">
                  <Check size={26} className="text-[var(--citron)]" />
                </div>
                <h2
                  id="waitlist-heading"
                  className="mt-6 font-display text-3xl leading-tight tracking-tight"
                >
                  You&apos;re in.
                </h2>
                <p className="mt-4 text-zinc-400 text-[15px] leading-relaxed">
                  {CONFIRMATION_COPY}
                </p>
                <div className="mt-6 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  {LAUNCH_PRICING.currency}
                  {LAUNCH_PRICING.foundingPrice} {LAUNCH_PRICING.period} · locked for life
                </div>
              </div>
            ) : (
              <>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Founding member
                </div>
                <h2
                  id="waitlist-heading"
                  className="mt-3 font-display text-3xl sm:text-4xl leading-[0.95] tracking-tight"
                >
                  Lock in{' '}
                  <span className="italic text-[var(--citron)]">
                    {LAUNCH_PRICING.currency}
                    {LAUNCH_PRICING.foundingPrice}
                  </span>{' '}
                  for life.
                </h2>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Three fields. We&apos;ll email you the moment StarlingPost opens.
                </p>

                <form onSubmit={submit} className="mt-7 space-y-4">
                  <Field label="Name">
                    <input
                      ref={nameRef}
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@studio.com"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="What you do">
                    <select
                      required
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="" disabled>
                        Select one
                      </option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[var(--ink)]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {error && (
                    <p className="text-[13px] text-[var(--coral)] font-mono">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--citron)] px-6 py-4 text-sm font-medium text-black transition-colors hover:bg-[#e6ff5e] disabled:opacity-60"
                  >
                    {status === 'saving' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        Claim founding price <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                    No card · No spam · Unsubscribe anytime
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const inputClass =
  'w-full bg-transparent border border-white/15 rounded-xl px-4 py-3.5 text-[16px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--citron)]/60 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
