import { Injectable, Logger } from '@nestjs/common';

export interface ScoredResult {
  repoId?: string;
  issueId?: string;
  issueRepositoryId?: string;
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

export type SimilarityFn = (dev: any, repos: any[]) => Promise<number[]>;

@Injectable()
export class MatchingEngine {
  private readonly logger = new Logger(MatchingEngine.name);

  /**
   * Pure rule-based scoring — fast, works without ML infra.
   */
  score(
    developer: any,
    candidates: any[],
    focus: 'repos' | 'issues',
  ): ScoredResult[] {
    const skills = developer.skills || {};
    const devLanguages = new Set<string>((skills.languages || []).map((l: string) => l.toLowerCase()));
    const devDomains = new Set<string>((skills.domains || []).map((d: string) => d.toLowerCase()));
    const devInterests = new Set<string>((developer.interests || []).map((i: string) => i.toLowerCase()));

    return candidates
      .map((candidate) => this.scoreCandidate(candidate, developer, devLanguages, devDomains, devInterests, focus))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Hybrid scoring — blends rule-based signals with ML vector similarity.
   * Falls back to pure rule-based if similarityFn throws or returns empty.
   */
  async scoreHybrid(
    developer: any,
    candidates: any[],
    focus: 'repos' | 'issues',
    similarityFn: SimilarityFn,
  ): Promise<ScoredResult[]> {
    const skills = developer.skills || {};
    const devLanguages = new Set<string>((skills.languages || []).map((l: string) => l.toLowerCase()));
    const devDomains = new Set<string>((skills.domains || []).map((d: string) => d.toLowerCase()));
    const devInterests = new Set<string>((developer.interests || []).map((i: string) => i.toLowerCase()));

    // Compute ML similarity scores
    let mlScores: number[] | null = null;
    try {
      mlScores = await similarityFn(developer, candidates);
    } catch (e) {
      this.logger.warn('ML similarity failed, falling back to rule-based', e);
    }

    const mlScoreMap = mlScores?.length === candidates.length
      ? new Map(candidates.map((c, i) => [this.candidateKey(c, focus), mlScores[i]]))
      : null;

    const scored = candidates.map((candidate) =>
      this.scoreCandidateHybrid(
        candidate, developer, devLanguages, devDomains, devInterests, focus,
        mlScoreMap?.get(this.candidateKey(candidate, focus)),
      ),
    );

    return scored.sort((a, b) => b.score - a.score);
  }

  private candidateKey(candidate: any, focus: string): string {
    if (focus === 'issues') return candidate.id || candidate.githubId;
    return candidate.fullName || candidate.id;
  }

  private scoreCandidateHybrid(
    candidate: any,
    developer: any,
    devLanguages: Set<string>,
    devDomains: Set<string>,
    devInterests: Set<string>,
    focus: 'repos' | 'issues',
    mlScore: number | undefined,
  ): ScoredResult {
    const ruleResult = this.scoreCandidate(candidate, developer, devLanguages, devDomains, devInterests, focus);

    if (mlScore !== undefined && mlScore >= 0) {
      // Blend: 40% rule-based + 60% ML similarity
      const blended = ruleResult.score * 0.4 + mlScore * 0.6;
      ruleResult.score = Math.max(0, Math.min(1, blended));

      if (mlScore > 0.7) {
        ruleResult.reasons.unshift('Strong semantic similarity to your profile and past projects.');
      } else if (mlScore > 0.5) {
        ruleResult.reasons.unshift('Good semantic match with your demonstrated skills and interests.');
      }
    }

    return ruleResult;
  }

  private scoreCandidate(
    candidate: any,
    developer: any,
    devLanguages: Set<string>,
    devDomains: Set<string>,
    devInterests: Set<string>,
    focus: 'repos' | 'issues',
  ): ScoredResult {
    const isIssue = focus === 'issues';
    const repo = isIssue ? candidate.repository : candidate;
    const repoTopics = repo?.topics || [];
    const repoDomainTags = repo?.domainTags || [];

    // --- Collect all languages from the repo (primary + secondary) ---
    const repoLanguages: string[] = [];
    if (repo?.primaryLanguage) repoLanguages.push(repo.primaryLanguage);
    if (repo?.secondaryLanguages?.length) {
      for (const lang of repo.secondaryLanguages) {
        if (!repoLanguages.includes(lang)) repoLanguages.push(lang);
      }
    }

    // --- Skill overlap ---
    const skillOverlap: string[] = [];
    for (const lang of repoLanguages) {
      if (devLanguages.has(lang.toLowerCase())) {
        if (!skillOverlap.includes(lang)) skillOverlap.push(lang);
      }
    }

    // --- Domain overlap ---
    const domainOverlap: string[] = [];
    for (const tag of [...repoDomainTags, ...repoTopics]) {
      if (devDomains.has(tag.toLowerCase()) || devInterests.has(tag.toLowerCase())) {
        if (!domainOverlap.includes(tag)) domainOverlap.push(tag);
      }
    }

    // --- Compute score components (each 0-1) ---
    const hasLangData = repoLanguages.length > 0;
    const skillScore = hasLangData
      ? Math.min(skillOverlap.length / Math.min(repoLanguages.length, 3), 1)
      : 0;

    const hasDomainData = repoDomainTags.length > 0 || repoTopics.length > 0;
    const domainScore = hasDomainData
      ? Math.min(domainOverlap.length / 2, 1)
      : 0;

    // Popularity: logarithmic scale gives better differentiation
    const stars = repo?.stargazersCount || 0;
    const popularityScore = stars > 0
      ? Math.min(Math.log10(stars) / 5, 1) // log10(100k)=5 → 1, log10(1k)=3 → 0.6
      : 0;

    const healthScore = repo?.communityHealthScore || 0;

    const issueBonus = isIssue && candidate.labels?.some((l: string) =>
      l.toLowerCase().includes('good first issue') || l.toLowerCase().includes('help wanted')
    ) ? 0.15 : 0;

    const diffPenalty = this.difficultyPenalty(candidate, developer, isIssue);

    // --- Weighted blend ---
    const totalScore = Math.max(0, Math.min(1,
      skillScore * 0.40 +
      domainScore * 0.25 +
      popularityScore * 0.15 +
      healthScore * 0.15 +
      issueBonus -
      diffPenalty
    ));

    // --- Difficulty ---
    const difficulty = this.inferDifficulty(candidate, isIssue);

    // --- Reasons ---
    const reasons: string[] = [];
    if (skillOverlap.length > 0) {
      reasons.push(`You use ${skillOverlap.slice(0, 3).join(', ')} — this repo's stack aligns with your skills.`);
    }
    if (domainOverlap.length > 0) {
      reasons.push(`Matches your interest in ${domainOverlap.slice(0, 2).join(', ')}.`);
    }
    if (repo?.communityHealthScore > 0.7) {
      reasons.push('Strong community health score: active maintainers, responsive reviews.');
    }
    if (isIssue && candidate.labels?.some((l: string) => l.toLowerCase().includes('good first issue'))) {
      reasons.push('Labeled "good first issue" — ideal for getting started.');
    }
    if (repo?.hasContributingGuide) {
      reasons.push('Has a clear CONTRIBUTING.md — easy onboarding.');
    }
    if (reasons.length === 0) {
      reasons.push('Popular project with active community.');
    }

    // --- Next steps ---
    const suggestedNextSteps: string[] = [
      isIssue
        ? `Read the issue and comment to express interest.`
        : 'Read CONTRIBUTING.md and setup docs.',
      isIssue
        ? 'Ask clarifying questions before starting work.'
        : 'Start with a small docs or test improvement to get familiar.',
      'Join the community: check for Discord/Slack links in the README.',
    ];

    return {
      ...(isIssue
        ? { issueId: candidate.id, issueRepositoryId: repo?.id }
        : { repoId: candidate.id }),
      title: isIssue ? candidate.title : repo?.fullName || 'Unknown',
      url: `https://github.com/${repo?.fullName || ''}${isIssue ? `/issues/${candidate.githubId || ''}` : ''}`,
      score: totalScore,
      reasons,
      fitSignals: {
        skillOverlap: skillOverlap.slice(0, 5),
        domainOverlap: domainOverlap.slice(0, 3),
        difficulty,
        communityHealth: repo?.communityHealthScore > 0.7 ? 'high' : repo?.communityHealthScore > 0.4 ? 'medium' : 'low',
        goalAlignment: (developer.goals || []).slice(0, 3),
      },
      suggestedNextSteps,
    };
  }

  private difficultyPenalty(candidate: any, developer: any, isIssue: boolean): number {
    const devLevel = developer.skills?.experienceLevel || 'beginner';
    const candDifficulty = this.inferDifficulty(candidate, isIssue);

    const levelRank: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
    const devRank = levelRank[devLevel] ?? 0;
    const candRank = levelRank[candDifficulty] ?? 0;

    if (candRank > devRank + 1) return 0.15;
    if (candRank === devRank + 1) return -0.05;
    return 0;
  }

  private inferDifficulty(candidate: any, isIssue: boolean): string {
    if (isIssue) {
      if (candidate.difficultyHint) return candidate.difficultyHint;
      const labels = (candidate.labels || []).map((l: string) => l.toLowerCase());
      if (labels.some((l: string) => l.includes('good first') || l.includes('beginner') || l.includes('easy'))) return 'beginner';
      if (labels.some((l: string) => l.includes('intermediate') || l.includes('medium'))) return 'intermediate';
      if (labels.some((l: string) => l.includes('advanced') || l.includes('hard') || l.includes('complex'))) return 'advanced';
      return 'intermediate';
    }

    if (candidate.difficultyLabel) return candidate.difficultyLabel;
    const stars = candidate.stargazersCount || 0;
    const contribs = candidate.activeContributorCount || 0;
    if (stars < 100 || contribs < 5) return 'beginner';
    if (stars < 5000 || contribs < 30) return 'intermediate';
    return 'advanced';
  }
}
