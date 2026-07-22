'use client';

import { useState, type FormEvent } from 'react';
import {
  ArrowRight, Loader2, Sparkles, GitBranch, AlertCircle, CheckCircle2,
  Bug, Code2, BookOpen, MessageSquare, ExternalLink, Zap, type LucideIcon,
} from 'lucide-react';

interface FitSignals {
  skillOverlap: string[];
  domainOverlap: string[];
  difficulty: string;
  communityHealth: string;
  goalAlignment: string[];
}

interface Recommendation {
  title: string;
  url: string;
  score: number;
  reasons: string[];
  fitSignals: FitSignals;
  suggestedNextSteps: string[];
}

interface RecommendResponse {
  developerSummary: string;
  recommendations: Recommendation[];
}

const diffColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const diffIcons: Record<string, LucideIcon> = { beginner: BookOpen, intermediate: Code2, advanced: Zap };

export function RecommendSection() {
  const [username, setUsername] = useState('');
  const [focus, setFocus] = useState<'repos' | 'issues'>('repos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${apiUrl}/api/v1/recommend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsername: username.trim(), context: { focus, maxResults: 6 } }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      setResult(await res.json());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') setError('Request timed out. Is the API server running?');
      else setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally { setLoading(false); }
  };

  return (
    <section id="recommend" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Get Recommendations</h2>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Enter your GitHub username. We analyze your skills and find the best repos or issues for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-[2]">
            <input
              type="text" value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your GitHub username (e.g. octocat)"
              className="w-full rounded-lg border border-border bg-white/[0.04] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              required
            />
          </div>
          <div className="flex-1">
            <div className="flex rounded-lg border border-border overflow-hidden h-full">
              {(['repos', 'issues'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setFocus(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${focus === tab ? 'bg-primary text-primary-foreground' : 'bg-white/[0.04] text-muted-foreground hover:text-foreground'}`}>
                  {tab === 'repos' ? 'Repos' : 'Issues'}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading || !username.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'Analyzing...' : 'Find Matches'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {result && (
        <div>
          <div className="mb-6 rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">{result.developerSummary}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{focus === 'repos' ? 'Repositories' : 'Issues'}</h3>
            <span className="text-sm text-muted-foreground">{result.recommendations.length} result{result.recommendations.length !== 1 ? 's' : ''}</span>
          </div>

          {result.recommendations.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <GitBranch className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No matching results found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.recommendations.map((rec, i) => {
                const DIcon = diffIcons[rec.fitSignals.difficulty] || BookOpen;
                return (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {focus === 'issues' ? <Bug className="h-4 w-4 text-primary shrink-0" /> : <GitBranch className="h-4 w-4 text-primary shrink-0" />}
                          <a href={rec.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors truncate">{rec.title}</a>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${diffColors[rec.fitSignals.difficulty] || 'glass'}`}><DIcon className="h-3 w-3" />{rec.fitSignals.difficulty}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${rec.fitSignals.communityHealth === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}><CheckCircle2 className="h-3 w-3" />{rec.fitSignals.communityHealth}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20"><Zap className="h-3 w-3" />{(rec.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {rec.reasons.slice(0, 3).map((r, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />{r}</li>
                      ))}
                    </ul>
                    {rec.fitSignals.skillOverlap.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {rec.fitSignals.skillOverlap.map((s) => <span key={s} className="rounded-md border border-border px-2 py-0.5 text-xs bg-white/[0.04]">{s}</span>)}
                      </div>
                    )}
                    {rec.fitSignals.domainOverlap.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {rec.fitSignals.domainOverlap.map((d) => <span key={d} className="rounded-md border border-primary/20 px-2 py-0.5 text-xs text-primary bg-primary/5">{d}</span>)}
                      </div>
                    )}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground"><MessageSquare className="inline h-3 w-3 mr-1" />Steps</summary>
                      <ol className="mt-2 space-y-1 pl-4 list-decimal">
                        {rec.suggestedNextSteps.map((step, j) => <li key={j} className="text-xs text-muted-foreground">{step}</li>)}
                      </ol>
                    </details>
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
