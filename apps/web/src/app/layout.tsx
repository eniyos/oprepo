import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/header';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Auralis from '@/components/ui/auralis';

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
      <body className="relative min-h-screen font-sans antialiased">
        <Auralis
          colors={["#3b82f6", "#1d4ed8", "#0f172a"]}
          speed={0.15}
          grain={0.2}
          height="100vh"
          className="fixed inset-0 z-0 w-full"
        />

        <div className="relative z-10">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
