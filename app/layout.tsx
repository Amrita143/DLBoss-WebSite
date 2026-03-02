import type { Metadata } from 'next';
import './globals.css';
import './styles/base.css';
import './styles/home.css';
import './styles/chart.css';
import './styles/content.css';

export const metadata: Metadata = {
  title: 'DLBOSS.COM | Satta Matka | Kalyan Matka | Fast Result',
  description: 'DLBOSS.COM fast result board with admin-driven market outcomes, jodi charts, panel charts, and market details.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
