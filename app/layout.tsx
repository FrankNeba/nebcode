import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Nebcode — Real-Time C & MySQL Learning Platform',
    template: '%s | Nebcode'
  },
  description: 'Master C programming and MySQL with our interactive, mobile-first IDE. Practice with real-time compilers and live database containers from anywhere.',
  keywords: ['C programming', 'MySQL', 'Online IDE', 'Learn coding mobile', 'Interactive SQL', 'Nebcode'],
  authors: [{ name: 'Nebcode Team' }],
  metadataBase: new URL('https://nebcode.ngwafrank.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nebcode — Master C & MySQL on the Go',
    description: 'The most interactive mobile platform to learn backend development.',
    url: 'https://nebcode.ngwafrank.com',
    siteName: 'Nebcode',
    images: [
      {
        url: '/logo.jpeg',
        width: 800,
        height: 800,
        alt: 'Nebcode Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebcode — Learn C & MySQL on Mobile',
    description: 'Interactive IDE and MySQL containers in your pocket.',
    images: ['/logo.jpeg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.jpeg' },
    ],
    apple: [
      { url: '/logo.jpeg' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nebcode',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#8b0a1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-950 antialiased flex flex-col">
        <Navbar />
        <main className="pb-24 md:pb-0">
          {children}
        </main>
        <MobileNav />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#13131f', color: '#e8e8f0', border: '1px solid #1a1a2e', borderRadius: '10px', fontSize: '13px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }} />
      </body>
    </html>
  );
}
