import type { Metadata } from 'next';
import './globals.css';
import './styles/base.css';
import './styles/home.css';
import './styles/chart.css';
import './styles/content.css';

export const metadata: Metadata = {
  title: 'DLBOSS.COM | Satta Matka | Kalyan Matka | Fast Result',
  description: 'DLBOSS.COM fast result board with admin-driven market outcomes, jodi charts, and panel charts.',
  icons: {
    icon: '/icon.jpg',
    shortcut: '/icon.jpg',
    apple: '/icon.jpg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
