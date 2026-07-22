import { MatchingEngine } from '../src/modules/recommendation/matching-engine.service';

describe('MatchingEngine', () => {
  let engine: MatchingEngine;

  beforeEach(() => {
    engine = new MatchingEngine();
  });

  it('should score repos higher with skill overlap', () => {
    const developer = {
      skills: { languages: ['TypeScript', 'Python'], domains: ['web', 'ML/AI'] },
      interests: ['react', 'machine-learning'],
      goals: ['learn'],
      constraints: [],
    };

    const candidates = [
      {
        fullName: 'vercel/next.js',
        topics: ['react', 'framework'],
        secondaryLanguages: ['TypeScript', 'JavaScript'],
        domainTags: ['web'],
        stargazersCount: 100000,
        communityHealthScore: 0.9,
        hasContributingGuide: true,
      },
      {
        fullName: 'some/obscure-tool',
        topics: ['hardware', 'embedded'],
        secondaryLanguages: ['C', 'Assembly'],
        domainTags: ['embedded'],
        stargazersCount: 50,
        communityHealthScore: 0.3,
        hasContributingGuide: false,
      },
    ];

    const results = engine.score(developer, candidates, 'repos');
    expect(results.length).toBe(2);
    // The TypeScript/React repo should rank higher
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].title).toBe('vercel/next.js');
    expect(results[0].reasons.length).toBeGreaterThan(0);
  });

  it('should return scored results with all required fields', () => {
    const developer = {
      skills: { languages: ['Rust'], domains: ['infra'] },
      interests: ['cli'],
      goals: [],
      constraints: [],
    };

    const candidates = [
      {
        fullName: 'rust-lang/rustfmt',
        topics: ['rust', 'formatter'],
        secondaryLanguages: ['Rust'],
        domainTags: ['devtools'],
        stargazersCount: 2000,
        communityHealthScore: 0.8,
        hasContributingGuide: true,
      },
    ];

    const results = engine.score(developer, candidates, 'repos');
    expect(results[0]).toHaveProperty('score');
    expect(results[0]).toHaveProperty('reasons');
    expect(results[0]).toHaveProperty('fitSignals');
    expect(results[0]).toHaveProperty('suggestedNextSteps');
    expect(results[0]).toHaveProperty('title');
    expect(results[0]).toHaveProperty('url');
    expect(results[0].fitSignals).toHaveProperty('skillOverlap');
    expect(results[0].fitSignals).toHaveProperty('domainOverlap');
    expect(results[0].fitSignals).toHaveProperty('difficulty');
    expect(results[0].fitSignals).toHaveProperty('communityHealth');
  });

  it('should handle empty developer skills gracefully', () => {
    const developer = {
      skills: { languages: [], domains: [] },
      interests: [],
      goals: [],
      constraints: [],
    };

    const candidates = [
      {
        fullName: 'org/empty-repo',
        topics: [],
        secondaryLanguages: [],
        domainTags: [],
        stargazersCount: 100,
        communityHealthScore: 0.5,
        hasContributingGuide: false,
      },
    ];

    const results = engine.score(developer, candidates, 'repos');
    expect(results.length).toBe(1);
    expect(results[0].score).toBeGreaterThanOrEqual(0);
  });
});
