import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'URL Shortener - Transform Long URLs into Short Links',
  description: 'A secure and fast URL shortener service. Transform long URLs into short, shareable links with our simple and reliable tool.',
  keywords: 'URL shortener, link shortener, short links, URL converter, link management',
  authors: [{ name: 'URL Shortener Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'URL Shortener - Transform Long URLs into Short Links',
    description: 'A secure and fast URL shortener service. Transform long URLs into short, shareable links.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'URL Shortener - Transform Long URLs into Short Links',
    description: 'A secure and fast URL shortener service. Transform long URLs into short, shareable links.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
