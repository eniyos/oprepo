import Link from 'next/link';
import { ArrowRight, GitPullRequest, Sparkles, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Find your next
          <span className="block text-[var(--primary)]">open-source contribution</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          OpRepo connects developers with repositories and issues they&apos;ll love.
          Personalized recommendations matched to your skills, interests, and goals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/recommend"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Get Recommendations
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/ingest"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted transition-colors"
          >
            Add a Repository
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: 'Smart Matching',
            desc: 'Our engine analyzes your GitHub profile, languages, and interests to find the best repos for you.',
          },
          {
            icon: GitPullRequest,
            title: 'Issue-Level Recommendations',
            desc: 'Get suggested issues that match your skill level — from good first issues to advanced challenges.',
          },
          {
            icon: Users,
            title: 'Healthy Communities',
            desc: 'We prioritize repos with active maintainers, clear contributing guides, and welcoming cultures.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6">
            <Icon className="h-8 w-8 text-[var(--primary)] mb-4" />
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
