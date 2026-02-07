// components/Footer.tsx
'use client';

import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Github,
  Heart,
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  Globe,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    Product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API', href: '/api' },
      { label: 'Changelog', href: '/changelog' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
    Resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Help Center', href: '/help' },
      { label: 'Community', href: '/community' },
      { label: 'Partners', href: '/partners' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/starlingpost', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/starlingpost', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/starlingpost', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/starlingpost', label: 'YouTube' },
    { icon: Github, href: 'https://github.com/starlingpost', label: 'GitHub' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    StarlingPost
                  </div>
                  <div className="text-sm text-gray-500">AI-Powered Social Suite</div>
                </div>
              </div>
              
              <p className="text-gray-500 mb-6 max-w-md">
                Transform your social media strategy with AI-powered content creation, scheduling, and analytics.
              </p>
              
              {/* Newsletter */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Stay Updated</h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500"
                  />
                  <button className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
                    Subscribe
                  </button>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-300 mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Email</div>
                  <div className="text-sm text-gray-500">hello@starlingpost.com</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Phone</div>
                  <div className="text-sm text-gray-500">+1 (555) 123-4567</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Location</div>
                  <div className="text-sm text-gray-500">San Francisco, CA</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-green-400" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>99.9% Uptime</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              &copy; {currentYear} StarlingPost. All rights reserved.
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Made with love for creators</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}