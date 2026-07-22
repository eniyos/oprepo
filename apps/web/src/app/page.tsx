'use client';

import Link from 'next/link';
import {
  ArrowRight,
  GitPullRequest,
  Sparkles,
  Users,
  Star,
  BarChart3,
  Shield,
  UserPlus,
  Github,
} from 'lucide-react';
import { InteractiveRobotSpline } from '@/components/blocks/interactive-3d-robot';
import { AnimatedFooter } from '@/components/blocks/animated-footer';

const ROBOT_SCENE_URL =
  'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

function FadeInSection({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-up opacity-0 ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative w-full h-screen overflow-hidden bg-[hsl(228,12%,6%)]">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-glow z-[1]" />

        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="absolute inset-0 z-0"
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4">
          <div className="text-center w-full max-w-4xl mx-auto">
            <FadeInSection delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-blue-200 mb-8">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Repository Matching
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Find your next{' '}
                <span className="text-gradient block mt-2">
                  open-source contribution
                </span>
              </h1>
            </FadeInSection>

            <FadeInSection delay={0.35} className="mt-6">
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Stop searching aimlessly. OpRepo analyzes your skills and matches
                you with repositories and issues you&apos;ll actually enjoy
                contributing to.
              </p>
            </FadeInSection>

            <FadeInSection delay={0.5} className="mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/recommend"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/25"
                >
                  Get Recommendations
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/ingest"
                  className="inline-flex items-center gap-2.5 rounded-xl glass glass-hover px-7 py-3.5 font-medium text-foreground transition-all"
                >
                  <Github className="h-4 w-4" />
                  Add Repository
                </Link>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.65} className="mt-12">
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Smart matching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <span>Skill analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Community health</span>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent z-10 pointer-events-none" />
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative z-20 border-y border-border/50 bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {[
              { value: '50+', label: 'Repositories indexed' },
              { value: '10+', label: 'Languages supported' },
              { value: 'ML', label: 'Vector similarity engine' },
            ].map(({ value, label }) => (
              <div key={label} className="py-8 text-center">
                <div className="text-2xl font-bold text-gradient">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section className="relative bg-background px-4 py-28 sm:px-6 lg:px-8 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
              From zero to your first contribution in three simple steps.
            </p>
          </FadeInSection>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Connect',
                desc: 'Enter your GitHub username. We analyze your languages, frameworks, and project interests to build your profile.',
                gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Match',
                desc: 'Our hybrid engine scores repositories across skill overlap, domain affinity, community health, and ML similarity.',
                gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
              },
              {
                step: '03',
                icon: GitPullRequest,
                title: 'Contribute',
                desc: 'Get curated recommendations with clear next steps — from good first issues to advanced features.',
                gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
              },
            ].map(({ step, icon: Icon, title, desc, gradient }) => (
              <div
                key={step}
                className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all duration-500`}
              >
                {/* Hover glow */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />
                <div className="relative">
                  <span className="text-4xl font-black text-white/[0.04] absolute -top-3 -right-2 select-none">
                    {step}
                  </span>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] group-hover:border-primary/30 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why OpRepo ─── */}
      <section className="relative px-4 py-28 sm:px-6 lg:px-8 overflow-hidden bg-card/30">
        <div className="mx-auto max-w-6xl">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for developers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
              Every feature designed to make your open-source journey smoother.
            </p>
          </FadeInSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'Hybrid AI Matching',
                desc: 'Combines rule-based scoring with ML vector similarity for recommendations that actually make sense.',
              },
              {
                icon: Users,
                title: 'Community Health',
                desc: 'We prioritize repos with active maintainers, clear contributing guides, and welcoming cultures.',
              },
              {
                icon: BarChart3,
                title: 'Skill Analysis',
                desc: 'Deep profile analysis across languages, frameworks, domains, and contribution patterns.',
              },
              {
                icon: Shield,
                title: 'Difficulty Fit',
                desc: 'Recommendations calibrated to your experience level — from beginner-friendly to advanced challenges.',
              },
              {
                icon: GitPullRequest,
                title: 'Issue-Level Matches',
                desc: 'Find specific issues tagged with your skills, from bug fixes to feature development.',
              },
              {
                icon: Star,
                title: 'Explainable Results',
                desc: 'Every recommendation comes with clear reasons and suggested next steps you can act on.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="mb-4 h-9 w-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:border-primary/30 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative px-4 py-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.04] rounded-full blur-3xl" />

        <FadeInSection className="relative mx-auto max-w-2xl text-center">
          <div className="rounded-2xl glass p-10 sm:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to find your next{' '}
              <span className="text-gradient">contribution</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-sm mx-auto">
              No setup required. Just enter your GitHub username and get matched
              instantly.
            </p>
            <Link
              href="/recommend"
              className="group mt-8 inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/25"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </FadeInSection>
      </section>

      {/* ─── Footer ─── */}
      <AnimatedFooter />
    </div>
  );
}
