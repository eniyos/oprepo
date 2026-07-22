import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/header';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'OpRepo — Find your next open-source contribution',
  description:
    'Personalized open-source repository recommendations matched to your skills and interests.',
  openGraph: {
    title: 'OpRepo — Find your next open-source contribution',
    description:
      'Personalized repository recommendations matched to your skills and interests.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', inter.variable)}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
