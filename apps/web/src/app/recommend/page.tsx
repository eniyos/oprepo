'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, Sparkles, GitBranch, AlertCircle, TrendingUp, Star, Zap, ExternalLink } from 'lucide-react';

interface ScoredItem {
  repoId?: string;
  issueId?: string;
  title: string;
  url: string;
  score: number;
  tier: string;
  starCount: number;
  trendingScore: number | null;
  matchReason: string;
  healthScore: number;
  suggestedNextSteps: string[];
  reasons: string[];
}

interface TieredResponse {
  developerSummary: string;
  bestMatches: ScoredItem[];
  trending: ScoredItem[];
  hiddenGems: ScoredItem[];
}

function RepoRow({ item, section }: { item: ScoredItem; section: 'best' | 'trending' | 'gems' }) {
  return (
    <div style={{ padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', transition: 'border-color 600ms ease-out' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <GitBranch style={{ width: 14, height: 14, color: '#7C9CF0', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8125rem', color: '#F2F4F8', textDecoration: 'none', transition: 'color 600ms ease-out', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7C9CF0'}
              onMouseLeave={e => e.currentTarget.style.color = '#F2F4F8'}>
              {item.title}
            </a>
            <ExternalLink style={{ width: 11, height: 11, color: '#8B92A3', flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid #7C9CF0', borderRadius: '0.375rem', fontSize: '0.6875rem', color: '#7C9CF0' }}>
              <Zap style={{ width: 10, height: 10 }} />
              {(item.score * 100).toFixed(0)}%
            </span>

            {section === 'trending' && item.trendingScore != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', fontSize: '0.6875rem', color: '#8B92A3' }}>
                <TrendingUp style={{ width: 10, height: 10 }} />
                +{(item.trendingScore * 100).toFixed(0)}% this week
              </span>
            )}

            {section === 'gems' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', fontSize: '0.6875rem', color: '#8B92A3' }}>
                <Star style={{ width: 10, height: 10 }} />
                {item.healthScore > 0.7 ? '92% health' : `${(item.healthScore * 100).toFixed(0)}% health`}
              </span>
            )}

            {section !== 'gems' && (
              <span style={{ fontSize: '0.6875rem', color: '#8B92A3' }}>
                {item.starCount >= 1000 ? `${(item.starCount / 1000).toFixed(1)}K` : item.starCount} stars
              </span>
            )}
          </div>

          <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#8B92A3', lineHeight: 1.4, marginBottom: 0 }}>
            {item.matchReason}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecommendPage() {
  const [username, setUsername] = useState('');
  const [focus, setFocus] = useState<'repos' | 'issues'>('repos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TieredResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${apiUrl}/api/v1/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername: username.trim(),
          context: { focus, maxResults: 10 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data: TieredResponse = await res.json();
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Is the API server running?');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  const sections: { key: keyof TieredResponse; title: string; subtitle: string; type: 'best' | 'trending' | 'gems' }[] = [
    { key: 'bestMatches', title: 'Best matches', subtitle: 'Top recommendations across popular and mid-range repos', type: 'best' },
    { key: 'trending', title: 'Trending', subtitle: 'Rising projects in your domain', type: 'trending' },
    { key: 'hiddenGems', title: 'Hidden gems', subtitle: 'Under-the-radar repos worth discovering', type: 'gems' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" style={{ paddingTop: '6rem' }}>
      <div className="mb-8">
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.01em', margin: 0 }}>Get Recommendations</h1>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8B92A3' }}>
          Enter your GitHub username. We analyze your skills and find the best repos for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. octocat"
              className="input-field"
              required
            />
          </div>
          <div style={{ display: 'flex', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', width: '140px' }}>
            {(['repos', 'issues'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setFocus(tab)}
                style={{
                  flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
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

      {error && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.375rem', color: '#fca5a5', fontSize: '0.8125rem' }}>
          <AlertCircle style={{ display: 'inline', width: 14, height: 14, marginRight: '0.375rem' }} />
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <Sparkles style={{ width: 14, height: 14, color: '#7C9CF0', marginTop: '2px' }} />
              <p style={{ fontSize: '0.8125rem', color: '#8B92A3', margin: 0 }}>{result.developerSummary}</p>
            </div>
          </div>

          {sections.map(({ key, title, subtitle, type }) => {
            const items = result[key] as ScoredItem[] | undefined;
            return (
              <div key={key} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#F2F4F8' }}>{title}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#8B92A3', marginLeft: '0.5rem' }}>{subtitle}</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#8B92A3' }}>{items?.length ?? 0} results</span>
                </div>

                {!items || items.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#8B92A3', margin: 0 }}>
                      {type === 'trending' && 'Nothing trending in your area right now.'}
                      {type === 'gems' && 'No hidden gems found matching your profile.'}
                      {type === 'best' && 'No matching results found.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {items.map((item, i) => (
                      <RepoRow key={`${key}-${i}`} item={item} section={type} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
