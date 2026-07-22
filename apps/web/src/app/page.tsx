'use client';

import Link from 'next/link';
import { ArrowRight, GitPullRequest, Sparkles, Users, Code2 } from 'lucide-react';
import { InteractiveRobotSpline } from '@/components/blocks/interactive-3d-robot';

const ROBOT_SCENE_URL =
  'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero Section with 3D Robot ─── */}
      <section className="relative w-full h-screen overflow-hidden">
        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="absolute inset-0 z-0"
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pointer-events-none">
          <div className="text-center text-white drop-shadow-lg w-full max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Code2 className="h-10 w-10" />
              <span className="text-3xl font-bold tracking-tight">OpRepo</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Find your next
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">
                open-source contribution
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              OpRepo connects developers with repositories and issues they&apos;ll love.
              Personalized recommendations matched to your skills, interests, and goals.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
              <Link
                href="/recommend"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-gray-900 hover:bg-white/90 transition-all shadow-2xl"
              >
                Get Recommendations
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/ingest"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 font-medium text-white hover:bg-white/10 transition-all"
              >
                Add a Repository
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* ─── Features Section ─── */}
      <section className="relative z-20 -mt-2 bg-background px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">
              How OpRepo works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Three simple steps to finding your next open-source project.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: '1. Connect',
                desc: 'Enter your GitHub username. We analyze your languages, frameworks, and project interests.',
              },
              {
                icon: Users,
                title: '2. Match',
                desc: 'Our engine scores repositories across skill overlap, domain affinity, and community health.',
              },
              {
                icon: GitPullRequest,
                title: '3. Contribute',
                desc: 'Get curated recommendations with suggested next steps — from good first issues to advanced challenges.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="bg-background px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to find your next contribution?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
            No setup required. Just enter your GitHub username and get matched
            instantly.
          </p>
          <Link
            href="/recommend"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-lg"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span>OpRepo</span>
          </div>
          <p>Find your next open-source contribution.</p>
        </div>
      </footer>
    </div>
  );
}
