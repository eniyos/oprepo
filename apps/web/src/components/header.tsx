'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14" style={{ background: 'transparent' }}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span style={{ color: '#F2F4F8', fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', letterSpacing: '0.02em' }}>
            OpRepo
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/ingest"
            className="pill pill-sm"
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', color: '#F2F4F8' }}
          >
            <Github style={{ width: 13, height: 13 }} />
            Add Repo
          </Link>
        </nav>
      </div>
    </header>
  );
}
