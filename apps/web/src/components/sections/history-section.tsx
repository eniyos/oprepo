'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, GitBranch, Loader2, MessageSquare, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react';

interface Item { id: string; type: 'repo' | 'issue'; repository?: { fullName: string } | null; issue?: { title: string; githubId: number } | null; matchScore: number; matchReasons: string[]; feedback?: string | null; createdAt: string; }

export function HistorySection() {
  const [devId, setDevId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!devId.trim()) return;
    setLoading(true); setError(null); setItems(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${apiUrl}/api/v1/recommend/history/${encodeURIComponent(devId.trim())}?limit=20`, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.status === 404) { setError('No recommendations found.'); setItems([]); return; }
      if (!res.ok) throw new Error('Error');
      setItems(await res.json());
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError' ? 'Request timed out.' : 'Failed to load');
    } finally { setLoading(false); }
  };

  return (
    <section id="history" style={{ scrollMarginTop: '80px', maxWidth: '48rem', margin: '0 auto', padding: '6rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.01em' }}>Recommendation History</h2>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8B92A3', maxWidth: '24rem', marginLeft: 'auto', marginRight: 'auto' }}>
          View past recommendations for a developer and how they were received.
        </p>
      </div>

      <form onSubmit={submit} style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 2 }}>
            <input value={devId} onChange={e => setDevId(e.target.value)} placeholder="Developer UUID" className="input-field" style={{ fontFamily: 'monospace' }} />
          </div>
          <button type="submit" disabled={loading || !devId.trim()}
            className="pill" style={{ border: 'none', cursor: loading || !devId.trim() ? 'not-allowed' : 'pointer', opacity: loading || !devId.trim() ? 0.4 : 1, color: '#F2F4F8' }}>
            {loading ? <Loader2 style={{ width: 14, height: 14 }} /> : <Clock style={{ width: 14, height: 14 }} />}
            {loading ? 'Loading...' : 'View'}
          </button>
        </div>
      </form>

      {error && <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', color: '#fca5a5', fontSize: '0.8125rem' }}><AlertCircle style={{ display: 'inline', width: 14, height: 14, marginRight: '0.375rem' }} />{error}</div>}

      {items && (
        <div>
          {items.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#8B92A3' }}>No recommendations yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#8B92A3', margin: 0 }}>{items.length} past recommendation{items.length !== 1 ? 's' : ''}</p>
              {items.map((item) => {
                const title = item.type === 'repo' ? item.repository?.fullName ?? 'Unknown' : item.issue?.title ?? 'Unknown';
                const url = item.type === 'repo' && item.repository?.fullName ? `https://github.com/${item.repository.fullName}` :
                  item.type === 'issue' && item.repository?.fullName && item.issue?.githubId ? `https://github.com/${item.repository.fullName}/issues/${item.issue.githubId}` : null;
                return (
                  <div key={item.id} style={{ padding: '0.875rem 1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', transition: 'border-color 600ms ease-out' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                      <GitBranch style={{ width: 14, height: 14, color: '#7C9CF0', marginTop: '2px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#F2F4F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                          {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#8B92A3', flexShrink: 0 }}><ExternalLink style={{ width: 11, height: 11 }} /></a>}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem', fontSize: '0.6875rem', color: '#8B92A3' }}>
                          <span style={{ padding: '0.125rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>{item.type}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid #7C9CF0', borderRadius: '0.375rem', color: '#7C9CF0' }}>
                            <TrendingUp style={{ width: 10, height: 10 }} />{(item.matchScore * 100).toFixed(0)}%
                          </span>
                          {item.feedback === 'positive' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.375rem', color: '#86efac' }}><ThumbsUp style={{ width: 10, height: 10 }} />Liked</span>}
                          {item.feedback === 'negative' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', color: '#fca5a5' }}><ThumbsDown style={{ width: 10, height: 10 }} />Not relevant</span>}
                        </div>
                        {item.matchReasons.length > 0 && (
                          <div style={{ marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                            {item.matchReasons.slice(0, 2).map((r, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontSize: '0.75rem', color: '#8B92A3' }}>
                                <CheckCircle2 style={{ width: 10, height: 10, color: '#7C9CF0', marginTop: '2px' }} />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p style={{ marginTop: '0.375rem', fontSize: '0.6875rem', color: '#8B92A3' }}>
                          <MessageSquare style={{ display: 'inline', width: 11, height: 11, marginRight: '0.25rem' }} />
                          {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
    </section>
  );
}
