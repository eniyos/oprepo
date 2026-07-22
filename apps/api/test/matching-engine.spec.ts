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

  describe('scoreHybrid', () => {
    it('should blend ML scores with rule-based scores', async () => {
      const developer = {
        skills: { languages: ['TypeScript'], domains: ['web'] },
        interests: ['react'],
        goals: [],
        constraints: [],
      };

      const candidates = [
        {
          fullName: 'org/ts-repo',
          topics: ['typescript'],
          secondaryLanguages: ['TypeScript'],
          domainTags: ['web'],
          stargazersCount: 5000,
          communityHealthScore: 0.8,
          hasContributingGuide: true,
        },
        {
          fullName: 'org/other-repo',
          topics: ['ruby'],
          secondaryLanguages: ['Ruby'],
          domainTags: ['backend'],
          stargazersCount: 100,
          communityHealthScore: 0.3,
          hasContributingGuide: false,
        },
      ];

      const results = await engine.scoreHybrid(
        developer,
        candidates,
        'repos',
        async () => [0.9, 0.2], // ML similarity scores
      );

      expect(results.length).toBe(2);
      // With mlScore=0.9 and rule score near 1, blended should be high
      expect(results[0].score).toBeGreaterThan(results[1].score);
      // ML similarity reason should be present
      expect(results[0].reasons[0]).toContain('semantic');
    });

    it('should add a ML similarity reason when mlScore is high', async () => {
      const developer = {
        skills: { languages: ['Python'], domains: ['ML/AI'] },
        interests: ['machine-learning'],
        goals: [],
        constraints: [],
      };

      const candidates = [
        {
          fullName: 'org/ml-project',
          topics: ['machine-learning', 'python'],
          secondaryLanguages: ['Python'],
          domainTags: ['ML/AI'],
          stargazersCount: 1000,
          communityHealthScore: 0.6,
          hasContributingGuide: true,
        },
      ];

      const results = await engine.scoreHybrid(
        developer,
        candidates,
        'repos',
        async () => [0.95],
      );

      expect(results[0].reasons[0]).toContain('Strong semantic');
    });

    it('should fall through with empty ML similarity gracefully', async () => {
      const developer = {
        skills: { languages: ['Go'], domains: ['infra'] },
        interests: [],
        goals: [],
        constraints: [],
      };

      const candidates = [
        {
          fullName: 'org/go-tool',
          topics: ['go', 'cli'],
          secondaryLanguages: ['Go'],
          domainTags: ['devtools'],
          stargazersCount: 500,
          communityHealthScore: 0.5,
          hasContributingGuide: false,
        },
      ];

      const results = await engine.scoreHybrid(
        developer,
        candidates,
        'repos',
        async () => [] as number[], // Empty ML scores
      );

      expect(results.length).toBe(1);
      expect(results[0].score).toBeGreaterThanOrEqual(0);
    });

    it('should fall through when similarityFn throws', async () => {
      const developer = {
        skills: { languages: ['Java'], domains: ['backend'] },
        interests: [],
        goals: [],
        constraints: [],
      };

      const candidates = [
        {
          fullName: 'org/java-app',
          topics: ['java'],
          secondaryLanguages: ['Java'],
          domainTags: ['backend'],
          stargazersCount: 300,
          communityHealthScore: 0.7,
          hasContributingGuide: true,
        },
      ];

      const results = await engine.scoreHybrid(
        developer,
        candidates,
        'repos',
        async () => { throw new Error('ML down'); },
      );

      expect(results.length).toBe(1);
      expect(results[0].score).toBeGreaterThanOrEqual(0);
    });
  });
});
