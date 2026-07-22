'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Star, BarChart3, Shield, Github } from 'lucide-react';
import { AnimatedFooter } from '@/components/blocks/animated-footer';

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
      <section className="relative w-full h-screen overflow-hidden">
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

        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent z-10 pointer-events-none" />
      </section>

      <AnimatedFooter />
    </div>
  );
}
