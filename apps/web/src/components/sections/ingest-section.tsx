'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export function IngestSection() {
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repo.trim()) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(`${apiUrl}/api/v1/github/ingest/repo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoFullName: repo.trim() }), signal: ctrl.signal,
      });
      if (!r.ok) throw new Error('Ingestion failed');
      try { await fetch(`${apiUrl}/api/v1/github/ingest/issues`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoFullName: repo.trim() }), signal: ctrl.signal }); } catch {}
      clearTimeout(t);
      setSuccess(`Queued ${repo} for ingestion.`);
      setRepo('');
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError' ? 'Request timed out.' : 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <section id="ingest" style={{ scrollMarginTop: '80px', maxWidth: '48rem', margin: '0 auto', padding: '6rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.01em' }}>Add a Repository</h2>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8B92A3', maxWidth: '24rem', marginLeft: 'auto', marginRight: 'auto' }}>
          Add any public GitHub repo to the recommendation index. It gets analyzed for language, domain, community health, and embedded for ML similarity.
        </p>
      </div>

      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 2 }}>
            <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="owner/repo (e.g. vercel/next.js)" className="input-field" />
          </div>
          <button type="submit" disabled={loading || !repo.trim()}
            className="pill-accent" style={{ border: 'none', cursor: loading || !repo.trim() ? 'not-allowed' : 'pointer', opacity: loading || !repo.trim() ? 0.4 : 1 }}>
            {loading ? <Loader2 style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
            {loading ? 'Queuing...' : 'Add'}
          </button>
        </div>
      </form>

      {error && <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', color: '#fca5a5', fontSize: '0.8125rem' }}><AlertCircle style={{ display: 'inline', width: 14, height: 14, marginRight: '0.375rem' }} />{error}</div>}
      {success && <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.375rem', color: '#86efac', fontSize: '0.8125rem' }}><CheckCircle2 style={{ display: 'inline', width: 14, height: 14, marginRight: '0.375rem' }} />{success}</div>}
    </section>
  );
}
