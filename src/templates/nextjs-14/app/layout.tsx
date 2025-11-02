import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Navigation } from '@/components/ui/Navigation'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Next.js 14 App',
    template: '%s | Next.js 14 App',
  },
  description: 'A modern Next.js 14 application with App Router and TypeScript',
  keywords: ['Next.js', 'React', 'TypeScript', 'App Router', 'Server Components'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://example.com',
    title: 'Next.js 14 App',
    description: 'A modern Next.js 14 application with App Router and TypeScript',
    siteName: 'Next.js 14 App',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next.js 14 App',
    description: 'A modern Next.js 14 application with App Router and TypeScript',
    creator: '@yourusername',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <footer className="border-t bg-white">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                  © {new Date().getFullYear()} Next.js 14 App. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
