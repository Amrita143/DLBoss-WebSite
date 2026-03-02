import type { Metadata } from 'next';
import './globals.css';
import './styles/base.css';
import './styles/home.css';
import './styles/chart.css';
import './styles/content.css';

export const metadata: Metadata = {
  title: 'Market Results App',
  description: 'Admin-driven market outcomes and charts.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
