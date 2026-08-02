import type { Metadata } from "next";
import { Barlow, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import { AuthProvider } from "@/components/providers/SessionProvider";
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import DisableContextMenu from '@/components/common/DisableContextMenu';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { nativeDB } from '@/lib/db-native';

const barlow = Barlow({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow',
});

const bebasNeue = Bebas_Neue({ 
  subsets: ["latin"],
  weight: ['400'],
  variable: '--font-bebas',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mtpcollective.com'),
  title: {
    default: 'MTP Collective | Photography',
    template: '%s | MTP Collective',
  },
  description: 'MTP Collective Photography - Capturing moments through a unique lens, specializing in sports, music, and street photography.',
  keywords: ['photography', 'sports photography', 'concert photography', 'street photography', 'music photography', 'MTP Collective', 'event photography'],
  authors: [{ name: 'MTP Collective' }],
  creator: 'MTP Collective',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mtpcollective.com',
    siteName: 'MTP Collective',
    title: 'MTP Collective | Photography',
    description: 'Capturing moments through a unique lens - sports, music, and street photography.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MTP Collective | Photography',
    description: 'Capturing moments through a unique lens - sports, music, and street photography.',
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
};

async function getSiteLogo(): Promise<string | null> {
  try {
    const setting = await nativeDB.getSetting('site:logo');
    return setting?.value || null;
  } catch (error) {
    console.error('Error fetching site logo:', error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const logoUrl = await getSiteLogo();

  // Disable right-click (context menu) on public pages for images
  // Excludes admin routes handled by middleware
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://pub-8473897a453e4a39824456dc238f2559.r2.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//pub-8473897a453e4a39824456dc238f2559.r2.dev" />
      </head>
      <body className={`${barlow.variable} ${bebasNeue.variable} font-sans antialiased bg-black text-white min-h-screen flex flex-col`}>
        <DisableContextMenu />
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/80">
              <div className="max-w-7xl mx-auto pl-2 pr-4 py-3">
                <Navigation logoUrl={logoUrl} />
              </div>
            </header>
            <main className="flex-grow pt-16">
              {children}
            </main>
            <footer className="border-t border-gray-800">
              <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-4">MTP Collective</h3>
                    <p className="text-gray-400">
                      Capturing moments through a unique lens
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                          Home
                        </Link>
                      </li>
                      <li>
                        <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">
                          Portfolio
                        </Link>
                      </li>
                      <li>
                        <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
                          Events
                        </Link>
                      </li>
                      <li>
                        <Link href="/articles" className="text-gray-400 hover:text-white transition-colors">
                          Articles
                        </Link>
                      </li>
                      <li>
                        <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                          About
                        </Link>
                      </li>
                      <li>
                        <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                          Contact
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
                    <div className="flex space-x-4">
                      <a href="https://www.instagram.com/monkey_take_photo/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Instagram</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                  <p>© {new Date().getFullYear()} MTP Collective. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
        <Toaster position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
