import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Automation',
  robots: { index: false, follow: false },
};

export default function AutomationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
