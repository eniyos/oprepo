'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function IngestPage() {
  const [repoName, setRepoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Ingest repo
      const repoRes = await fetch(`${apiUrl}/api/v1/github/ingest/repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repoName.trim() }),
        signal: controller.signal,
      });
      if (!repoRes.ok) throw new Error(`Ingestion failed: ${repoRes.statusText}`);

      // Also ingest issues (best-effort)
      try {
        await fetch(`${apiUrl}/api/v1/github/ingest/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoFullName: repoName.trim() }),
          signal: controller.signal,
        });
      } catch {
        // issues ingestion is non-critical
      }

      clearTimeout(timeoutId);
      setSuccess(`Successfully ingested ${repoName}.`);
      setRepoName('');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Is the API server running?');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to ingest repository');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add a Repository</h1>
        <p className="mt-2 text-muted-foreground">
          Add a GitHub repository to the recommendation index. It will be analyzed and matched against developer profiles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="repoName" className="mb-1.5 block text-sm font-medium">
              Repository (owner/repo)
            </label>
            <input
              id="repoName"
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. vercel/next.js"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !repoName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading ? 'Ingesting...' : 'Add Repository'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
}
