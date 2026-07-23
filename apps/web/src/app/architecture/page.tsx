'use client';

import { FaGithub, FaLinkedinIn } from 'react-icons/fa6';
import Link from 'next/link';

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#F2F4F8', letterSpacing: '0.01em', margin: 0 }}>{title}</h1>
      <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8B92A3', maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto' }}>{sub}</p>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" style={{ paddingTop: '6rem' }}>
      {/* Back link */}
      <Link href="/" className="pill" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2rem' }}>
        &larr; Back to home
      </Link>

      <SectionHeader title="How it&rsquo;s built" sub="The technical decisions behind OpRepo&rsquo;s recommendation engine." />

      {/* 1. Pitch */}
      <div style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#8B92A3', lineHeight: 1.7, margin: 0 }}>
          Hybrid recommendation engine combining <strong style={{ color: '#F2F4F8', fontWeight: 400 }}>rule-based scoring</strong> (language overlap, domain affinity, community health)
          with <strong style={{ color: '#F2F4F8', fontWeight: 400 }}>ML vector similarity</strong> (384-dim embeddings via <code style={{ color: '#7C9CF0' }}>sentence-transformers/all-MiniLM-L6-v2</code>),
          served through a <strong style={{ color: '#F2F4F8', fontWeight: 400 }}>NestJS API</strong> with Postgres+pgvector for similarity search
          and Redis-backed async job queues for ingestion.
        </p>
      </div>

      {/* 2. Architecture diagram */}
      <div style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', marginBottom: '2rem', overflow: 'hidden' }}>
        <p style={{ fontSize: '0.75rem', color: '#F2F4F8', margin: '0 0 1rem 0', letterSpacing: '0.02em' }}>System architecture</p>
        <svg viewBox="0 0 720 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width="720" height="280" fill="rgba(10,10,14,0.3)" rx="6" />

          <rect x="40" y="100" width="120" height="48" rx="4" fill="rgba(124,156,240,0.12)" stroke="rgba(124,156,240,0.3)" strokeWidth="1" />
          <text x="100" y="128" textAnchor="middle" fill="#F2F4F8" fontSize="12" fontWeight="400">Next.js App</text>

          <line x1="160" y1="124" x2="220" y2="124" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <polygon points="218,119 228,124 218,129" fill="rgba(255,255,255,0.2)" />

          <rect x="230" y="90" width="130" height="68" rx="4" fill="rgba(124,156,240,0.12)" stroke="rgba(124,156,240,0.3)" strokeWidth="1" />
          <text x="295" y="116" textAnchor="middle" fill="#F2F4F8" fontSize="12" fontWeight="400">NestJS API</text>
          <text x="295" y="134" textAnchor="middle" fill="#8B92A3" fontSize="9">TypeORM + Bull</text>
          <text x="295" y="146" textAnchor="middle" fill="#8B92A3" fontSize="9">Axios + Redis</text>

          <line x1="295" y1="158" x2="295" y2="200" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <polygon points="290,198 295,208 300,198" fill="rgba(255,255,255,0.2)" />
          <rect x="235" y="208" width="120" height="38" rx="4" fill="rgba(124,156,240,0.12)" stroke="rgba(124,156,240,0.3)" strokeWidth="1" />
          <text x="295" y="232" textAnchor="middle" fill="#F2F4F8" fontSize="11" fontWeight="400">PostgreSQL 16</text>
          <text x="295" y="244" textAnchor="middle" fill="#7C9CF0" fontSize="9">+ pgvector</text>

          <line x1="360" y1="110" x2="410" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <polygon points="408,105 418,110 408,115" fill="rgba(255,255,255,0.2)" />
          <rect x="420" y="88" width="100" height="44" rx="4" fill="rgba(124,156,240,0.12)" stroke="rgba(124,156,240,0.3)" strokeWidth="1" />
          <text x="470" y="108" textAnchor="middle" fill="#F2F4F8" fontSize="11" fontWeight="400">Redis</text>
          <text x="470" y="122" textAnchor="middle" fill="#8B92A3" fontSize="9">Bull queues</text>

          <line x1="230" y1="110" x2="130" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="130" y1="110" x2="130" y2="44" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="130" y1="44" x2="260" y2="44" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <polygon points="258,39 268,44 258,49" fill="rgba(255,255,255,0.2)" />
          <rect x="268" y="22" width="130" height="44" rx="4" fill="rgba(124,156,240,0.12)" stroke="rgba(124,156,240,0.3)" strokeWidth="1" />
          <text x="333" y="42" textAnchor="middle" fill="#F2F4F8" fontSize="11" fontWeight="400">ML Service</text>
          <text x="333" y="56" textAnchor="middle" fill="#8B92A3" fontSize="9">sentence-transformers</text>

          <line x1="360" y1="140" x2="440" y2="200" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <polygon points="438,195 448,205 443,198" fill="rgba(255,255,255,0.2)" />
          <rect x="430" y="200" width="110" height="38" rx="4" fill="rgba(124,156,240,0.12)" stroke="rgba(124,156,240,0.3)" strokeWidth="1" />
          <text x="485" y="224" textAnchor="middle" fill="#F2F4F8" fontSize="11" fontWeight="400">GitHub API</text>
          <text x="485" y="236" textAnchor="middle" fill="#8B92A3" fontSize="9">REST + GraphQL</text>

          <text x="40" y="265" fill="#8B92A3" fontSize="9">Client</text>
          <text x="130" y="265" fill="#8B92A3" fontSize="9">API</text>
          <text x="240" y="265" fill="#8B92A3" fontSize="9">Storage</text>
          <text x="350" y="265" fill="#8B92A3" fontSize="9">Infra</text>
          <text x="440" y="265" fill="#8B92A3" fontSize="9">External</text>
        </svg>
      </div>

      {/* 3. Tech stack */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {[
          { label: 'Backend', value: 'NestJS, TypeORM, Bull' },
          { label: 'Frontend', value: 'Next.js 14, React 18, Tailwind' },
          { label: 'Database', value: 'PostgreSQL 16 + pgvector' },
          { label: 'Cache / Queue', value: 'Redis' },
          { label: 'ML', value: 'Python, sentence-transformers' },
          { label: 'Model', value: 'all-MiniLM-L6-v2 (384d)' },
          { label: 'External', value: 'GitHub REST + GraphQL' },
          { label: 'Infra', value: 'Docker Compose' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
            <p style={{ fontSize: '0.6875rem', color: '#8B92A3', margin: '0 0 0.25rem 0', letterSpacing: '0.02em' }}>{s.label}</p>
            <p style={{ fontSize: '0.8125rem', color: '#F2F4F8', margin: 0, lineHeight: 1.4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 4. Tradeoffs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', color: '#7C9CF0', fontFamily: 'monospace' }}>01</span>
            <span style={{ fontSize: '0.8125rem', color: '#F2F4F8' }}>40% rules / 60% ML mix</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8B92A3', lineHeight: 1.6, margin: 0 }}>
            Pure ML would fail for new users with no contribution history (cold start) and wouldn&rsquo;t explain <em style={{ color: '#A5AEC0' }}>why</em> a repo was recommended.
            The rule-based layer guarantees every recommendation has interpretable reasons (&ldquo;you know TypeScript and this repo uses it&rdquo;),
            while ML vector similarity catches the non-obvious matches (&ldquo;this Rust web framework attracts the same devs who like Express&rdquo;).
            The 60% ML weight increases as the user accumulates feedback, but the rules never fully drop out.
          </p>
        </div>
        <div style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', color: '#7C9CF0', fontFamily: 'monospace' }}>02</span>
            <span style={{ fontSize: '0.8125rem', color: '#F2F4F8' }}>pgvector over a dedicated vector DB</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8B92A3', lineHeight: 1.6, margin: 0 }}>
            Pinecone or Qdrant would be faster at 100M+ vectors, but OpRepo operates at the scale of thousands of repos, not billions.
            Staying in Postgres via pgvector means zero additional infrastructure, one fewer network hop for hybrid queries (vector + metadata filters in a single SQL statement),
            and a simpler deployment story for anyone self-hosting. The tradeoff is write latency at extreme scale, which isn&rsquo;t relevant here.
          </p>
        </div>
      </div>

      {/* 5. Verified checks */}
      <div style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.375rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#F2F4F8', margin: '0 0 0.75rem 0', letterSpacing: '0.02em' }}>Current build status</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { label: 'TypeScript', value: 'passing', color: '#4ade80' },
            { label: 'Lint', value: 'passing', color: '#4ade80' },
            { label: 'Build', value: 'passing', color: '#4ade80' },
            { label: 'Tests (API)', value: 'passing', color: '#4ade80' },
            { label: 'Repos indexed', value: '54', color: '#7C9CF0' },
            { label: 'Embeddings', value: '384d', color: '#7C9CF0' },
          ].map(check => (
            <div key={check.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.25rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: check.color }} />
              <span style={{ fontSize: '0.75rem', color: '#8B92A3' }}>{check.label}</span>
              <span style={{ fontSize: '0.75rem', color: '#F2F4F8', fontWeight: 400 }}>{check.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Links out */}
      <div style={{ textAlign: 'center', paddingBottom: '4rem' }}>
        <p style={{ fontSize: '0.8125rem', color: '#8B92A3', margin: '0 0 1.25rem 0' }}>
          Curious to see the code or talk about the work?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <a href="https://github.com/eniyos/oprepo" target="_blank" rel="noopener noreferrer" className="pill-accent" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
            <FaGithub size={14} />
            Source code
          </a>
          <a href="https://github.com/eniyos" target="_blank" rel="noopener noreferrer" className="pill" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', color: '#F2F4F8' }}>
            <FaGithub size={14} />
            GitHub
          </a>
          <a href="https://linkedin.com/in/eniyos" target="_blank" rel="noopener noreferrer" className="pill" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', color: '#F2F4F8' }}>
            <FaLinkedinIn size={14} />
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
