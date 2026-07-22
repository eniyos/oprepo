import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'OpRepo — Find your next open-source contribution',
  description: 'Personalized open-source repository recommendations matched to your skills and interests.',
  openGraph: {
    title: 'OpRepo — Find your next open-source contribution',
    description: 'Personalized repository recommendations matched to your skills and interests.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
