'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Github, GitFork, Sparkles, Star, BarChart3, Shield, Search, Users, GitPullRequest, Zap, Layers, TrendingUp, Database, Code2, GitCommit, Activity, type LucideIcon } from 'lucide-react';

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ opacity: 0, animation: `fadeUp 0.8s ease-out forwards`, animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.01em', margin: 0 }}>{title}</h2>
      <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8B92A3', maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto' }}>{sub}</p>
    </div>
  );
}

function StatCounter({ value, label, icon: Icon }: { value: number; label: string; icon: any }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(value / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else { setCount(start); }
    }, duration / 60);
    return () => clearInterval(timer);
  }, [value]);

  let display: string;
  if (value >= 1000000) display = `${(count / 1000000).toFixed(count >= value ? 0 : 1)}M`;
  else if (value >= 1000) display = `${(count / 1000).toFixed(count >= value ? 0 : 1)}K`;
  else display = count.toString();

  return (
    <div style={{ textAlign: 'center' }}>
      <Icon style={{ width: 18, height: 18, color: '#7C9CF0', margin: '0 auto 0.5rem' }} />
      <div style={{ fontSize: '1.5rem', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.02em' }}>
        {display}
      </div>
      <div style={{ fontSize: '0.6875rem', color: '#8B92A3', marginTop: '0.25rem', letterSpacing: '0.01em' }}>{label}</div>
    </div>
  );
}

const STEPS = [
  { icon: Github, title: 'Connect', desc: 'Enter your GitHub username. We analyze your languages, frameworks, and project interests.' },
  { icon: Sparkles, title: 'Match', desc: 'Our hybrid engine scores repositories across skill overlap, domain affinity, and ML similarity.' },
  { icon: GitPullRequest, title: 'Contribute', desc: 'Get curated recommendations with clear next steps — from good first issues to advanced features.' },
];

const FEATURES = [
  { icon: Zap, title: 'Hybrid AI Matching', desc: 'Rule-based scoring plus ML vector similarity for recommendations that make sense.' },
  { icon: Users, title: 'Community Health', desc: 'We prioritize repos with active maintainers, clear contributing guides, and welcoming cultures.' },
  { icon: BarChart3, title: 'Skill Analysis', desc: 'Deep profile analysis across languages, frameworks, domains, and contribution patterns.' },
  { icon: Shield, title: 'Difficulty Fit', desc: 'Recommendations calibrated to your experience level — beginner to advanced.' },
  { icon: GitPullRequest, title: 'Issue-Level Matches', desc: 'Find specific issues tagged with your skills, from bug fixes to feature dev.' },
  { icon: Star, title: 'Explainable Results', desc: 'Every recommendation comes with clear reasons and suggested next steps.' },
];

const LIVE_STATS = [
  { value: 54, label: 'Repositories indexed', icon: Database },
  { value: 2154, label: 'Issues analyzed', icon: GitCommit },
  { value: 9, label: 'Languages supported', icon: Code2 },
  { value: 384, label: 'Embedding dimensions', icon: Layers },
  { value: 4413683, label: 'Total stars across repos', icon: Star },
  { value: 36, label: 'Recommendations made', icon: Activity },
  { value: 26, label: 'Domain tags', icon: BarChart3 },
  { value: 10, label: 'Developers onboarded', icon: Users },
];

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ═══ 1. HEADLINE, SUBHEAD, CTA ═══ */}
      <section style={{ position: 'relative', width: '100%', minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7rem 1rem 3rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '40rem', margin: '0 auto' }}>
            <Fade delay={0.2}>
              <div className="pill pill-sm" style={{ marginBottom: '2rem', color: '#8B92A3', borderColor: 'rgba(255,255,255,0.12)' }}>
                <Sparkles style={{ width: 12, height: 12 }} />
                AI-Powered Repository Matching
              </div>
            </Fade>
            <Fade delay={0.35}>
              <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)', fontWeight: 300, lineHeight: 1.15, letterSpacing: '0.01em', color: '#F2F4F8', margin: 0 }}>
                Find your next
                <span style={{ display: 'block', marginTop: '0.25rem', color: '#7C9CF0', fontWeight: 300 }}>
                  open-source contribution
                </span>
              </h1>
            </Fade>
            <Fade delay={0.5}>
              <p style={{ marginTop: '1.5rem', fontSize: '1rem', lineHeight: 1.6, color: '#8B92A3', maxWidth: '30rem', margin: '1.5rem auto 0', fontWeight: 400, letterSpacing: '0.01em' }}>
                OpRepo analyzes your skills and matches you with repositories and issues you&apos;ll actually enjoy contributing to.
              </p>
            </Fade>
            <Fade delay={0.65}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3" style={{ marginTop: '2.5rem' }}>
                <a href="#how" className="pill-accent" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
                  Get Recommendations
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </a>
                <a href="#features" className="pill" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem', color: '#F2F4F8' }}>
                  Learn More
                </a>
              </div>
            </Fade>
          </div>
        </div>
        {/* Scroll indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}>
          <span style={{ color: '#8B92A3', fontSize: '0.75rem', letterSpacing: '0.02em', animation: 'pulse 2s ease-in-out infinite' }}>↓ Scroll</span>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }`}</style>
      </section>

      {/* ═══ 2. EMBEDDING VISUALIZATION ═══ */}
      <section style={{ padding: '6rem 1rem', maxWidth: '56rem', margin: '0 auto' }}>
        <SectionHeader title="How embeddings see your skills" sub="Your profile and every repo is mapped into a 384-dimensional vector space. We find the closest matches." />
        <div style={{ position: 'relative', height: '220px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', overflow: 'hidden' }}>
          {/* Simulated embedding space with dot clusters */}
          <svg width="100%" height="100%" viewBox="0 0 800 220" style={{ background: 'rgba(10,10,14,0.3)' }}>
            {/* Grid lines */}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <line key={`v${i}`} x1={i*80+40} y1={0} x2={i*80+40} y2={220} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}
            {[0,1,2,3,4,5].map(i => (
              <line key={`h${i}`} x1={0} y1={i*36+20} x2={800} y2={i*36+20} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}
            {/* Cluster 1 — frontend */}
            <circle cx="200" cy="90" r="45" fill="rgba(124,156,240,0.06)" />
            {[{x:175,y:75},{x:195,y:65},{x:215,y:80},{x:185,y:100},{x:210,y:95},{x:190,y:85},{x:205,y:70},{x:180,y:90}].map((p,i) => (
              <circle key={`f${i}`} cx={p.x} cy={p.y} r="3" fill="rgba(124,156,240,0.6)" />
            ))}
            <text x="200" y="145" textAnchor="middle" fill="#8B92A3" fontSize="10">Frontend</text>
            {/* Cluster 2 — backend */}
            <circle cx="420" cy="110" r="40" fill="rgba(124,156,240,0.06)" />
            {[{x:395,y:100},{x:415,y:90},{x:435,y:105},{x:405,y:120},{x:425,y:115},{x:440,y:95},{x:410,y:85}].map((p,i) => (
              <circle key={`b${i}`} cx={p.x} cy={p.y} r="3" fill="rgba(124,156,240,0.5)" />
            ))}
            <text x="420" y="160" textAnchor="middle" fill="#8B92A3" fontSize="10">Backend</text>
            {/* Cluster 3 — ML */}
            <circle cx="600" cy="80" r="35" fill="rgba(124,156,240,0.06)" />
            {[{x:580,y:70},{x:600,y:60},{x:620,y:75},{x:590,y:90},{x:610,y:85},{x:595,y:78}].map((p,i) => (
              <circle key={`m${i}`} cx={p.x} cy={p.y} r="3" fill="rgba(124,156,240,0.5)" />
            ))}
            <text x="600" y="125" textAnchor="middle" fill="#8B92A3" fontSize="10">ML / Data</text>
            {/* User highlight */}
            <circle cx="280" cy="65" r="8" fill="#7C9CF0" opacity="0.3" />
            <circle cx="280" cy="65" r="5" fill="#7C9CF0" />
            <text x="280" y="58" textAnchor="middle" fill="#7C9CF0" fontSize="9" fontWeight="500">You</text>
            {/* Connecting lines from user to clusters */}
            <line x1="288" y1="65" x2="340" y2="80" stroke="rgba(124,156,240,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="288" y1="65" x2="370" y2="95" stroke="rgba(124,156,240,0.1)" strokeWidth="1" strokeDasharray="3,3" />
          </svg>
        </div>
      </section>

      {/* ═══ 3. TRUST STRIP ═══ */}
      <section style={{ padding: '4rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2.5rem', maxWidth: '56rem', margin: '0 auto' }}>
          {LIVE_STATS.map(s => (
            <StatCounter key={s.label} value={s.value} label={s.label} icon={s.icon} />
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', maxWidth: '48rem', margin: '0 auto' }} />

      {/* ═══ 4. HOW IT WORKS ═══ */}
      <section id="how" style={{ scrollMarginTop: '80px', padding: '6rem 1rem', maxWidth: '48rem', margin: '0 auto' }}>
        <SectionHeader title="How it works" sub="Three steps from zero to your first contribution." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {STEPS.map((step, i) => (
            <div key={step.title} style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', transition: 'border-color 600ms ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <step.icon style={{ width: 16, height: 16, color: '#7C9CF0' }} />
                <span style={{ fontSize: '0.6875rem', color: '#8B92A3', fontFamily: 'monospace' }}>0{i+1}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 300, color: '#F2F4F8', margin: 0, marginBottom: '0.5rem', letterSpacing: '0.01em' }}>{step.title}</h3>
              <p style={{ fontSize: '0.8125rem', color: '#8B92A3', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', maxWidth: '48rem', margin: '0 auto' }} />

      {/* ═══ 5. FEATURE / VALUE HIGHLIGHTS ═══ */}
      <section id="features" style={{ scrollMarginTop: '80px', padding: '6rem 1rem', maxWidth: '56rem', margin: '0 auto' }}>
        <SectionHeader title="Built for developers" sub="Every feature designed to make your open-source journey smoother." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', transition: 'border-color 600ms ease-out' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
              <f.icon style={{ width: 16, height: 16, color: '#7C9CF0', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 400, color: '#F2F4F8', margin: 0, marginBottom: '0.375rem', letterSpacing: '0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: '0.75rem', color: '#8B92A3', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', maxWidth: '48rem', margin: '0 auto' }} />

      {/* ═══ 6. PRODUCT SCREENSHOTS ═══ */}
      <section style={{ padding: '6rem 1rem', maxWidth: '56rem', margin: '0 auto' }}>
        <SectionHeader title="See it in action" sub="Enter a username, pick repos or issues, get instant matches." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Screenshot card 1 */}
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(124,156,240,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search style={{ width: 14, height: 14, color: '#7C9CF0' }} />
                <span style={{ fontSize: '0.8125rem', color: '#F2F4F8' }}>Profile Analysis</span>
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {['TypeScript', 'JavaScript', 'CSS'].map(l => (
                    <span key={l} style={{ padding: '0.125rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.25rem', fontSize: '0.6875rem', color: '#8B92A3' }}>{l}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {['frontend', 'react', 'ui'].map(d => (
                    <span key={d} style={{ padding: '0.125rem 0.5rem', border: '1px solid #7C9CF0', borderRadius: '0.25rem', fontSize: '0.6875rem', color: '#7C9CF0' }}>{d}</span>
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(124,156,240,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: '73%', height: '100%', background: '#7C9CF0', borderRadius: '2px', opacity: 0.6 }} />
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#8B92A3' }}>Match confidence: 73%</span>
              </div>
            </div>
          </div>

          {/* Screenshot card 2 — recommendations list */}
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(124,156,240,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#7C9CF0' }} />
                <span style={{ fontSize: '0.8125rem', color: '#F2F4F8' }}>Top Recommendations</span>
              </div>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[['vercel/next.js', '85%'], ['react/react', '80%'], ['microsoft/vscode', '78%']].map(([name, score]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GitFork style={{ width: 12, height: 12, color: '#7C9CF0' }} />
                    <span style={{ fontSize: '0.75rem', color: '#F2F4F8' }}>{name}</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#7C9CF0' }}>{score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot card 3 — embedding match */}
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(124,156,240,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers style={{ width: 14, height: 14, color: '#7C9CF0' }} />
                <span style={{ fontSize: '0.8125rem', color: '#F2F4F8' }}>Skill Match</span>
              </div>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                <span style={{ color: '#8B92A3' }}>Language overlap</span>
                <span style={{ color: '#F2F4F8' }}>2/3</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <div style={{ width: '66%', height: '100%', background: '#7C9CF0', borderRadius: '2px', opacity: 0.6 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                <span style={{ color: '#8B92A3' }}>Domain affinity</span>
                <span style={{ color: '#F2F4F8' }}>3/3</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <div style={{ width: '100%', height: '100%', background: '#7C9CF0', borderRadius: '2px', opacity: 0.6 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                <span style={{ color: '#8B92A3' }}>ML similarity</span>
                <span style={{ color: '#F2F4F8' }}>0.89</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <div style={{ width: '89%', height: '100%', background: '#7C9CF0', borderRadius: '2px', opacity: 0.6 }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href="/recommend" className="pill-accent" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
            Try it with your GitHub
            <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      </section>

      {/* ═══ 7. MINIMAL FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', color: '#F2F4F8', fontWeight: 300, letterSpacing: '0.02em', margin: 0 }}>OpRepo</p>
          <p style={{ fontSize: '0.6875rem', color: '#8B92A3', marginTop: '0.75rem', marginBottom: 0 }}>Find your next open-source contribution. &copy; {new Date().getFullYear()}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <a href="https://github.com/eniyos/oprepo" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.6875rem', color: '#8B92A3', textDecoration: 'none', transition: 'color 600ms ease-out' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F2F4F8'} onMouseLeave={e => e.currentTarget.style.color = '#8B92A3'}>GitHub</a>
            <a href="/" style={{ fontSize: '0.6875rem', color: '#8B92A3', textDecoration: 'none', transition: 'color 600ms ease-out' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F2F4F8'} onMouseLeave={e => e.currentTarget.style.color = '#8B92A3'}>About</a>
            <a href="/recommend" style={{ fontSize: '0.6875rem', color: '#8B92A3', textDecoration: 'none', transition: 'color 600ms ease-out' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F2F4F8'} onMouseLeave={e => e.currentTarget.style.color = '#8B92A3'}>Recommend</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
