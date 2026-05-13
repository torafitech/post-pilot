// components/Footer.tsx
'use client';

import { Twitter, Linkedin, Youtube, Github } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const APP_PATHS = ['/dashboard', '/posts', '/automation', '/analytics', '/settings', '/profile'];

export function Footer() {
  const pathname = usePathname();

  // Don't render footer inside the app — each page manages its own footer strip
  if (APP_PATHS.some(p => pathname?.startsWith(p))) return null;

  const links = {
    Product: [
      { label: 'Features',   href: '/#features'  },
      { label: 'Pricing',    href: '/pricing'     },
      { label: 'Changelog',  href: '/changelog'   },
    ],
    Company: [
      { label: 'About',  href: '/about'  },
      { label: 'Blog',   href: '/blog'   },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms',   href: '/terms'   },
    ],
  };

  const social = [
    { Icon: Twitter,  href: 'https://twitter.com/starlingpost',         label: 'Twitter'  },
    { Icon: Linkedin, href: 'https://linkedin.com/company/starlingpost', label: 'LinkedIn' },
    { Icon: Youtube,  href: 'https://youtube.com/starlingpost',         label: 'YouTube'  },
    { Icon: Github,   href: 'https://github.com/torafitech/post-pilot', label: 'GitHub'   },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0b] border-t border-stone-800">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-14">

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-display italic text-2xl text-stone-100 mb-3">
              StarlingPost
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 leading-relaxed max-w-[200px]">
              One post.<br />All platforms.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {social.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-stone-600 hover:text-stone-300 transition-colors"
                >
                  <s.Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-4">
                {category}
              </div>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-stone-400 hover:text-stone-100 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            © {year} StarlingPost · starlingpost.com
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            <span className="w-1 h-1 rounded-full bg-[#d4ff3a]" />
            Built for creators
          </span>
        </div>
      </div>
    </footer>
  );
}
