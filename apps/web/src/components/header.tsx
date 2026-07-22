'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, GitFork, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300',
        isHome
          ? 'bg-transparent'
          : 'bg-background/80 backdrop-blur-xl border-b border-border/50',
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <div className="h-3.5 w-3.5 rounded-[3px] bg-primary" />
          </div>
          <span
            className={cn(
              'font-semibold text-base tracking-tight',
              isHome ? 'text-white' : 'text-foreground',
            )}
          >
            OpRepo
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {[
            { href: '/', label: 'Discover', icon: Search },
            { href: '/recommend', label: 'Recommend', icon: GitFork },
            { href: '/history', label: 'History', icon: Clock },
          ].map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isHome
                    ? 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                    : isActive
                      ? 'text-foreground bg-white/[0.06]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <div className="ml-3 pl-3 border-l border-border/50">
            <Link
              href="/ingest"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                isHome
                  ? 'bg-white text-gray-900 hover:bg-white/90'
                  : 'bg-primary text-primary-foreground hover:brightness-110',
              )}
            >
              <Github className="h-4 w-4" />
              <span>Add Repo</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
