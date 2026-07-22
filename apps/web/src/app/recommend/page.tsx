'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, Sparkles, GitBranch, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Recommendation {
  title: string;
  url: string;
  score: number;
  reasons: string[];
  fitSignals: {
    skillOverlap: string[];
    domainOverlap: string[];
    difficulty: string;
    communityHealth: string;
    goalAlignment: string[];
  };
  suggestedNextSteps: string[];
}

interface RecommendResponse {
  developerSummary: string;
  recommendations: Recommendation[];
}

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
      const res = await fetch(`${apiUrl}/api/v1/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername: username.trim(),
          context: { focus, maxResults: 6 },
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data: RecommendResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Get Recommendations</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your GitHub username and we&apos;ll find repositories matched to your skills.
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
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              required
            />
          </div>
          <div className="sm:w-40">
            <label className="mb-1.5 block text-sm font-medium">Focus</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value as 'repos' | 'issues')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="repos">Repositories</option>
              <option value="issues">Issues</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : 'Find Repos'}
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
      {result && (
        <div>
          {/* Developer summary */}
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-[var(--primary)] shrink-0" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.developerSummary}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-[var(--primary)] shrink-0" />
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:text-[var(--primary)] transition-colors truncate"
                      >
                        {rec.title}
                      </a>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-foreground)]">
                        {rec.fitSignals.difficulty}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        rec.fitSignals.communityHealth === 'high'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {rec.fitSignals.communityHealth} health
                      </span>
                      <span className="rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--secondary-foreground)]">
                        {(rec.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                <ul className="mt-3 space-y-1">
                  {rec.reasons.map((reason, j) => (
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
                      <span key={skill} className="rounded-md border border-border px-2 py-0.5 text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Next steps */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Suggested next steps
                  </summary>
                  <ol className="mt-2 space-y-1 pl-4 list-decimal">
                    {rec.suggestedNextSteps.map((step, j) => (
                      <li key={j} className="text-xs text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
