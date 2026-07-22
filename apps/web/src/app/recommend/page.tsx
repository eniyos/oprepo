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

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const difficultyIcons: Record<string, LucideIcon> = {
  beginner: BookOpen,
  intermediate: Code2,
  advanced: Zap,
};

export default function RecommendPage() {
  const [username, setUsername] = useState('');
  const [focus, setFocus] = useState<'repos' | 'issues'>('repos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);

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
          context: { focus, maxResults: 6 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data: RecommendResponse = await res.json();
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Get Recommendations</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your GitHub username and we&apos;ll find the best repos or issues matched to your skills.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-10 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
              GitHub Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. octocat"
              className="w-full rounded-lg border border-border bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              required
            />
          </div>
          <div className="sm:w-40">
            <label className="mb-1.5 block text-sm font-medium">Focus</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {['repos', 'issues'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFocus(tab as 'repos' | 'issues')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                    focus === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.04] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'repos' ? 'Repositories' : 'Issues'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : `Find ${focus === 'repos' ? 'Repos' : 'Issues'}`}
            </button>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Developer summary */}
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.developerSummary}
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {focus === 'repos' ? 'Recommended Repositories' : 'Recommended Issues'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {result.recommendations.length} result{result.recommendations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Recommendations */}
          {result.recommendations.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <GitBranch className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No matching results found for this profile.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(result.recommendations ?? []).map((rec, i) => {
                const DifficultyIcon = difficultyIcons[rec.fitSignals.difficulty] || BookOpen;
                return (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {focus === 'issues' ? (
                            <Bug className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <GitBranch className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold hover:text-primary transition-colors truncate"
                          >
                            {rec.title}
                          </a>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>

                        {/* Badges */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {/* Difficulty */}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${difficultyColors[rec.fitSignals.difficulty] || 'glass'}`}>
                            <DifficultyIcon className="h-3 w-3" />
                            {rec.fitSignals.difficulty}
                          </span>
                          {/* Community health */}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            rec.fitSignals.communityHealth === 'high'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            <CheckCircle2 className="h-3 w-3" />
                            {rec.fitSignals.communityHealth}
                          </span>
                          {/* Score */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                            <Zap className="h-3 w-3" />
                            {(rec.score * 100).toFixed(0)}% match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reasons */}
                    <ul className="mt-3 space-y-1">
                      {rec.reasons.slice(0, 3).map((reason, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>

                    {/* Skill tags */}
                    {rec.fitSignals.skillOverlap.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {rec.fitSignals.skillOverlap.map((skill) => (
                          <span key={skill} className="rounded-md border border-border px-2 py-0.5 text-xs bg-white/[0.04]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Domain tags */}
                    {rec.fitSignals.domainOverlap.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {rec.fitSignals.domainOverlap.map((domain) => (
                          <span key={domain} className="rounded-md border border-primary/20 px-2 py-0.5 text-xs text-primary bg-primary/5">
                            {domain}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Next steps */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare className="inline h-3 w-3 mr-1" />
                        Suggested next steps
                      </summary>
                      <ol className="mt-2 space-y-1 pl-4 list-decimal">
                        {rec.suggestedNextSteps.map((step, j) => (
                          <li key={j} className="text-xs text-muted-foreground">{step}</li>
                        ))}
                      </ol>
                    </details>
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
