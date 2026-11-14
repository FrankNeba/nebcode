import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { DeviceOtpModal } from '@/components/auth/DeviceOtpModal';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Nebcode — C Programming, MySQL & GCE MCQ Practice for Secondary School Students',
    template: '%s | Nebcode',
  },
  description:
    'Master C programming, MySQL databases, and GCE Computer Science MCQ past papers with Nebcode. Designed for secondary school students in Cameroon to code and practice on mobile phones or computers.',
  keywords: [
    'Nebcode',
    'GCE Computer Science',
    'Cameroon GCE A Level Computer Science',
    'Cameroon GCE O Level Computer Science',
    'C programming online compiler',
    'MySQL practice lab',
    'GCE Computer Science MCQ past questions',
    'Learn coding on mobile Cameroon',
    'CSC 0795',
    'ICT 0796',
  ],
  authors: [{ name: 'Nebcode', url: 'https://nebcode.ngwafrank.com' }],
  creator: 'Nebcode',
  publisher: 'Nebcode',
  metadataBase: new URL('https://nebcode.ngwafrank.com'),
  alternates: {
    canonical: 'https://nebcode.ngwafrank.com',
  },
  openGraph: {
    title: 'Nebcode — Learn C Programming, MySQL & GCE MCQ Papers on Your Phone',
    description:
      'Interactive C compiler, live MySQL database lab, structured courses, and timed 50-question GCE MCQ past papers for secondary school students.',
    url: 'https://nebcode.ngwafrank.com',
    siteName: 'Nebcode',
    images: [
      {
        url: '/logo.jpeg',
        width: 800,
        height: 800,
        alt: 'Nebcode Learning Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebcode — C Programming, MySQL & GCE MCQ Platform',
    description:
      'Write and run C programs, query a live MySQL database, and practice GCE MCQ past papers from your phone or PC.',
    images: ['/logo.jpeg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo.jpeg' }],
    apple: [{ url: '/logo.jpeg' }],
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
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b0a1a',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://nebcode.ngwafrank.com/#organization',
      name: 'Nebcode',
      url: 'https://nebcode.ngwafrank.com',
      logo: 'https://nebcode.ngwafrank.com/logo.jpeg',
      description:
        'Interactive learning platform for secondary school students in Cameroon offering C programming courses, live MySQL database labs, and GCE Computer Science MCQ past papers.',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'CM',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+237677482442',
        email: 'nebcode26@gmail.com',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://nebcode.ngwafrank.com/#website',
      url: 'https://nebcode.ngwafrank.com',
      name: 'Nebcode',
      publisher: {
        '@id': 'https://nebcode.ngwafrank.com/#organization',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('nebcode_theme');
                  var mode = (t === 'light' || t === 'dark') ? t : 'dark';
                  document.documentElement.setAttribute('data-theme', mode);
                  document.documentElement.classList.add(mode);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-dark-950 antialiased flex flex-col font-sans">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <DeviceOtpModal />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                color: 'var(--text-body)',
                border: '1px solid var(--card-border)',
                borderRadius: '10px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
