'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Code2, GitFork, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 transition-colors',
        isHome
          ? 'bg-transparent text-white'
          : 'border-b border-border bg-background/80 backdrop-blur-sm text-foreground',
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 font-semibold text-lg',
            isHome ? 'text-white' : '',
          )}
        >
          <Code2 className="h-6 w-6" />
          <span>OpRepo</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              isHome
                ? 'text-white/70 hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Search className="h-4 w-4" />
            Discover
          </Link>
          <Link
            href="/recommend"
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              isHome
                ? 'text-white/70 hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <GitFork className="h-4 w-4" />
            Recommend
          </Link>
          <Link
            href="/history"
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              isHome
                ? 'text-white/70 hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Clock className="h-4 w-4" />
            History
          </Link>
          <Link
            href="/ingest"
            className={cn(
              'inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90',
              isHome
                ? 'bg-white text-gray-900'
                : 'bg-[var(--primary)] text-[var(--primary-foreground)]',
            )}
          >
            + Add Repo
          </Link>
        </nav>
      </div>
    </header>
  );
}
