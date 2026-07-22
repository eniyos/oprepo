'use client';

import { ArrowRight, Sparkles, Star, BarChart3, Shield, Github, GitFork, Clock, Plus } from 'lucide-react';
import { AnimatedFooter } from '@/components/blocks/animated-footer';
import { RecommendSection } from '@/components/sections/recommend-section';
import { IngestSection } from '@/components/sections/ingest-section';
import { HistorySection } from '@/components/sections/history-section';

function FadeInSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-up opacity-0 ${className}`} style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}>
      {children}
    </div>
  );
}

const NAV_ITEMS = [
  { href: '#recommend', icon: GitFork, label: 'Recommend' },
  { href: '#ingest', icon: Plus, label: 'Add Repo' },
  { href: '#history', icon: Clock, label: 'History' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative w-full min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16">
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
                <span className="text-gradient block mt-2">open-source contribution</span>
              </h1>
            </FadeInSection>

            <FadeInSection delay={0.35} className="mt-6">
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                OpRepo analyzes your skills and matches you with repositories and issues you&apos;ll actually enjoy contributing to.
              </p>
            </FadeInSection>

            <FadeInSection delay={0.5} className="mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#recommend"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-lg shadow-primary/25">
                  Get Recommendations
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a href="#ingest"
                  className="inline-flex items-center gap-2.5 rounded-xl glass glass-hover px-7 py-3.5 font-medium text-foreground transition-all">
                  <Github className="h-4 w-4" />
                  Add Repository
                </a>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.65} className="mt-12">
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-yellow-500" /><span>Smart matching</span></div>
                <div className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-blue-400" /><span>Skill analysis</span></div>
                <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-green-400" /><span>Community health</span></div>
              </div>
            </FadeInSection>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center pb-8">
          <div className="flex gap-3">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <a key={href} href={href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass glass-hover text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* ─── Recommend Section ─── */}
      <RecommendSection />

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* ─── Ingest Section ─── */}
      <IngestSection />

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* ─── History Section ─── */}
      <HistorySection />

      {/* ─── Footer ─── */}
      <AnimatedFooter />
    </div>
  );
}
