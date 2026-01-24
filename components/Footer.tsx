// components/Footer.tsx
import Link from 'next/link';

export  function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} StarlingPost. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-slate-700 transition">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-700 transition">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-slate-700 transition">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
