import Link from 'next/link';
import { Clock, Code2, GitFork, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Code2 className="h-6 w-6 text-[var(--primary)]" />
          <span>OpRepo</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            Discover
          </Link>
          <Link
            href="/recommend"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitFork className="h-4 w-4" />
            Recommend
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="h-4 w-4" />
            History
          </Link>
          <Link
            href="/ingest"
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            + Add Repo
          </Link>
        </nav>
      </div>
    </header>
  );
}
