import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site';
import './globals.css';
import './styles/base.css';
import './styles/home.css';
import './styles/chart.css';
import './styles/content.css';

const siteUrl = getSiteUrl();
const siteTitle = 'DLBOSS.COM | Satta Matka | Kalyan Matka | Fast Result';
const siteDescription =
  'DLBOSS.COM is an admin-driven result board for live market outcomes, jodi charts, and panel charts.';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: 'DLBOSS',
  title: siteTitle,
  description: siteDescription,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'DLBOSS',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/icon.jpg',
        width: 1080,
        height: 1080,
        alt: 'DLBOSS logo'
      }
    ]
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
    images: ['/icon.jpg']
  },
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
