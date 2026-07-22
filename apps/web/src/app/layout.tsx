import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/header';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import Auralis from '@/components/ui/auralis';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-heading' });

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
      className={cn('font-sans', inter.variable, poppins.variable)}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="relative min-h-screen antialiased">
        <Auralis
          colors={["#2A4A8C", "#4A6FBF", "#0F1A2E"]}
          speed={0.12}
          grain={0.18}
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
