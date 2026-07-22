'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, Sparkles, GitBranch, AlertCircle, CheckCircle2, Bug, BookOpen, Code2, ExternalLink, Zap, type LucideIcon } from 'lucide-react';

interface Rec { title: string; url: string; score: number; reasons: string[]; fitSignals: { skillOverlap: string[]; domainOverlap: string[]; difficulty: string; communityHealth: string; }; suggestedNextSteps: string[]; }
interface Res { developerSummary: string; recommendations: Rec[]; }

const diffIcons: Record<string, LucideIcon> = { beginner: BookOpen, intermediate: Code2, advanced: Zap };
const diffColors: Record<string, string> = { beginner: 'rgba(74,222,128,0.6)', intermediate: 'rgba(250,204,21,0.6)', advanced: 'rgba(248,113,113,0.6)' };

export function RecommendSection() {
  const [username, setUsername] = useState('');
  const [focus, setFocus] = useState<'repos' | 'issues'>('repos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Res | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${apiUrl}/api/v1/recommend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsername: username.trim(), context: { focus, maxResults: 6 } }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error('API error');
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError' ? 'Request timed out.' : 'Failed to get recommendations');
    } finally { setLoading(false); }
  };

  return (
    <section id="recommend" style={{ scrollMarginTop: '80px', maxWidth: '48rem', margin: '0 auto', padding: '6rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.01em' }}>Get Recommendations</h2>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8B92A3', maxWidth: '24rem', marginLeft: 'auto', marginRight: 'auto' }}>
          Enter your GitHub username. We analyze your skills and find the best repos or issues for you.
        </p>
      </div>

      <form onSubmit={submit} style={{ marginBottom: '3rem' }}>
        <div className="flex flex-col sm:flex-row" style={{ gap: '0.75rem' }}>
          <div style={{ flex: 2 }}>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your GitHub username (e.g. octocat)" className="input-field" />
          </div>
          <div style={{ flex: 1, display: 'flex', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            {(['repos', 'issues'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setFocus(tab)}
                style={{
                  flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0.01em',
                  color: focus === tab ? '#7C9CF0' : '#8B92A3',
                  background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 600ms ease-out',
                }}>
                {tab === 'repos' ? 'Repos' : 'Issues'}
              </button>
            ))}
          </div>
          <button type="submit" disabled={loading || !username.trim()}
            className="pill-accent" style={{ border: 'none', cursor: loading || !username.trim() ? 'not-allowed' : 'pointer', opacity: loading || !username.trim() ? 0.4 : 1 }}>
            {loading ? <Loader2 style={{ width: 14, height: 14 }} /> : <ArrowRight style={{ width: 14, height: 14 }} />}
            {loading ? 'Analyzing...' : 'Find Matches'}
          </button>
        </div>
      </form>

      {error && <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', color: '#fca5a5', fontSize: '0.8125rem' }}><AlertCircle style={{ display: 'inline', width: 14, height: 14, marginRight: '0.375rem' }} />{error}</div>}

      {result && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <Sparkles style={{ width: 14, height: 14, color: '#7C9CF0', marginTop: '2px' }} />
              <p style={{ fontSize: '0.8125rem', color: '#8B92A3', margin: 0 }}>{result.developerSummary}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#F2F4F8' }}>{focus === 'repos' ? 'Repos' : 'Issues'}</span>
            <span style={{ fontSize: '0.75rem', color: '#8B92A3' }}>{result.recommendations.length} result{result.recommendations.length !== 1 ? 's' : ''}</span>
          </div>

          {result.recommendations.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#8B92A3' }}>No matching results found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {result.recommendations.map((r, i) => {
                const DIcon = diffIcons[r.fitSignals.difficulty] || BookOpen;
                return (
                  <div key={i} style={{ padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', transition: 'border-color 600ms ease-out' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      {focus === 'issues' ? <Bug style={{ width: 14, height: 14, color: '#7C9CF0', marginTop: '2px' }} /> : <GitBranch style={{ width: 14, height: 14, color: '#7C9CF0', marginTop: '2px' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.8125rem', color: '#F2F4F8', textDecoration: 'none', transition: 'color 600ms ease-out', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#7C9CF0'}
                            onMouseLeave={e => e.currentTarget.style.color = '#F2F4F8'}>
                            {r.title}
                          </a>
                          <ExternalLink style={{ width: 11, height: 11, color: '#8B92A3', flexShrink: 0 }} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', fontSize: '0.6875rem', color: '#8B92A3' }}>
                            <DIcon style={{ width: 10, height: 10, color: diffColors[r.fitSignals.difficulty] || '#8B92A3' }} />
                            {r.fitSignals.difficulty}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', fontSize: '0.6875rem', color: '#8B92A3' }}>
                            <CheckCircle2 style={{ width: 10, height: 10, color: '#8B92A3' }} />
                            {r.fitSignals.communityHealth}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid #7C9CF0', borderRadius: '0.375rem', fontSize: '0.6875rem', color: '#7C9CF0' }}>
                            <Zap style={{ width: 10, height: 10 }} />
                            {(r.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        {r.reasons.length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                            {r.reasons.slice(0, 2).map((reason, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontSize: '0.75rem', color: '#8B92A3' }}>
                                <CheckCircle2 style={{ width: 10, height: 10, color: '#7C9CF0', marginTop: '2px' }} />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
