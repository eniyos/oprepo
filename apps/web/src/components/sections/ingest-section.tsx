'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export function IngestSection() {
  const [repoName, setRepoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const repoRes = await fetch(`${apiUrl}/api/v1/github/ingest/repo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repoName.trim() }), signal: controller.signal,
      });
      if (!repoRes.ok) throw new Error(`Ingestion failed: ${repoRes.statusText}`);
      try { await fetch(`${apiUrl}/api/v1/github/ingest/issues`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoFullName: repoName.trim() }), signal: controller.signal }); } catch {}
      clearTimeout(timeoutId);
      setSuccess(`Queued ${repoName} for ingestion.`);
      setRepoName('');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') setError('Request timed out.');
      else setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <section id="ingest" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Add a Repository</h2>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Add any public GitHub repo to the recommendation index. It gets analyzed for language, domain, community health, and embedded for ML similarity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-[2]">
            <input type="text" value={repoName} onChange={(e) => setRepoName(e.target.value)}
              placeholder="owner/repo (e.g. vercel/next.js)"
              className="w-full rounded-lg border border-border bg-white/[0.04] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50" required />
          </div>
          <button type="submit" disabled={loading || !repoName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? 'Queuing...' : 'Add Repository'}
          </button>
        </div>
      </form>

      {error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {success && <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}
    </section>
  );
}
