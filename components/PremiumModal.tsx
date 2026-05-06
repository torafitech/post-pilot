'use client';

import { Sparkles, Zap, Clock, Users, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  const { toast } = useToast();
  if (!open) return null;

  const handleSubscribeClick = () => {
    toast.success(
      "You're on the list",
      'Premium is in active development. We will email you when subscriptions open.',
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Premium — coming soon</h2>
            <p className="text-xs text-gray-500">
              Power features for creators who want more reach and less manual work.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <Feature icon={<Users size={15} />} title="Multi-platform expansion"
            desc="Connect Instagram, Facebook, Threads, and TikTok alongside YouTube, X, and LinkedIn." />
          <Feature icon={<Zap size={15} />} title="AI time slots"
            desc="Smart per-platform posting time recommendations based on your audience engagement." />
          <Feature icon={<Clock size={15} />} title="Advanced scheduling"
            desc="Recurring slots, queues, and AI-picked optimal times — beyond simple now/later." />
        </div>

        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300 flex items-start gap-2">
          <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Premium subscriptions are not live yet. Active development; rollout coming.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleSubscribeClick}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition"
          >
            Notify me
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
