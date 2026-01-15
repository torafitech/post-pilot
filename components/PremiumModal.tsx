'use client';

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  if (!open) return null;

  const handleSubscribeClick = () => {
    alert(
      'Premium is coming soon! These features are under development and will be available in a future update. You will be notified when subscriptions open.',
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="max-w-lg w-full bg-white/90 border border-slate-200 rounded-2xl shadow-xl p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 text-lg"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xl">
            ⭐
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Premium features (coming soon)
            </h2>
            <p className="text-xs text-slate-500">
              Unlock more platforms, AI timing, and advanced scheduling once premium launches.
            </p>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-3 mb-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base">
              📱
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Extra social accounts
              </p>
              <p className="text-xs text-slate-500">
                Connect more platforms like Facebook, LinkedIn, TikTok, and Pinterest in addition to Instagram, YouTube, and X.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                AI posting time recommendations
              </p>
              <p className="text-xs text-slate-500">
                Get smart AI recommendations for the best time to post on each platform, based on engagement patterns.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base">
              ⏰
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Advanced scheduling controls
              </p>
              <p className="text-xs text-slate-500">
                Use custom schedules, recurring slots, and AI‑picked time slots instead of only posting now.
              </p>
            </div>
          </div>
        </div>

        {/* Coming soon banner */}
        <div className="mb-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
          <span className="mt-0.5">🚧</span>
          <span>
            Premium subscriptions are not live yet. These features are in active development
            and will be rolled out soon.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubscribeClick}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold shadow-sm hover:shadow transition"
          >
            I’m interested – notify me
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
