'use client';

import { useState, type FormEvent } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, ExternalLink, GitBranch,
  Loader2, MessageSquare, ThumbsDown, ThumbsUp, TrendingUp,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'repo' | 'issue';
  repository?: {
    fullName: string;
  } | null;
  issue?: {
    title: string;
    githubId: number;
  } | null;
  matchScore: number;
  matchReasons: string[];
  suggestedSteps: string[];
  feedback?: string | null;
  createdAt: string;
}

interface HistoryResponse {
  developerSummary?: string;
  items: HistoryItem[];
}

export default function HistoryPage() {
  const [developerId, setDeveloperId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistoryResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!developerId.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `${apiUrl}/api/v1/recommend/history/${encodeURIComponent(developerId.trim())}?limit=20`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      if (res.status === 404) {
        setError('No recommendations found for this developer.');
        setData({ items: [] });
        return;
      }
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);

      const items: HistoryItem[] = await res.json();
      setData({ items });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Is the API server running?');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Recommendation History</h1>
        <p className="mt-2 text-muted-foreground">
          View past recommendations for a developer and how they were received.
        </p>
      </div>

      {/* Developer ID input */}
      <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="devId" className="mb-1.5 block text-sm font-medium">
              Developer ID
            </label>
            <input
              id="devId"
              type="text"
              value={developerId}
              onChange={(e) => setDeveloperId(e.target.value)}
              placeholder="e.g. e04e6888-b6f1-432b-a1dd-51e62dee4ae5"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !developerId.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {loading ? 'Loading...' : 'View History'}
            </button>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div>
          {data.items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No recommendations yet for this developer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Showing {data.items.length} past recommendation{data.items.length !== 1 ? 's' : ''}
              </p>

              {data.items.map((item) => {
                const title = item.type === 'repo'
                  ? item.repository?.fullName ?? 'Unknown repo'
                  : item.issue?.title ?? 'Unknown issue';

                const url = item.type === 'repo' && item.repository?.fullName
                  ? `https://github.com/${item.repository.fullName}`
                  : item.type === 'issue' && item.repository?.fullName && item.issue?.githubId
                    ? `https://github.com/${item.repository.fullName}/issues/${item.issue.githubId}`
                    : null;

                return (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                          <span className="font-semibold text-sm truncate">{title}</span>
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-medium text-[var(--accent-foreground)]">
                            {item.type}
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            <TrendingUp className="h-3 w-3" />
                            {(item.matchScore * 100).toFixed(0)}% match
                          </span>
                          {item.feedback === 'positive' && (
                            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                              <ThumbsUp className="h-3 w-3" />
                              Liked
                            </span>
                          )}
                          {item.feedback === 'negative' && (
                            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-400">
                              <ThumbsDown className="h-3 w-3" />
                              Not relevant
                            </span>
                          )}
                        </div>

                        {/* Reasons */}
                        {item.matchReasons.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {item.matchReasons.slice(0, 3).map((reason, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Timestamp */}
                        <p className="mt-2 text-xs text-muted-foreground">
                          <MessageSquare className="mr-1 inline h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
