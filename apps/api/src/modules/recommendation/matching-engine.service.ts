import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

@Injectable()
export class MatchingEngine {
  private readonly logger = new Logger(MatchingEngine.name);

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

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
    const repoLanguages = repo?.secondaryLanguages || [];
    const repoTopics = repo?.topics || [];
    const repoDomainTags = repo?.domainTags || [];

    // --- Skill overlap ---
    const skillOverlap: string[] = [];
    for (const lang of repoLanguages) {
      if (devLanguages.has(lang.toLowerCase())) {
        skillOverlap.push(lang);
      }
    }

    // --- Domain overlap ---
    const domainOverlap: string[] = [];
    for (const tag of [...repoDomainTags, ...repoTopics]) {
      if (devDomains.has(tag.toLowerCase()) || devInterests.has(tag.toLowerCase())) {
        domainOverlap.push(tag);
      }
    }

    // --- Compute score components ---
    const skillScore = repoLanguages.length > 0
      ? skillOverlap.length / Math.min(repoLanguages.length, 5)
      : 0.2;

    const domainScore = repoTopics.length > 0
      ? domainOverlap.length / Math.min(repoTopics.length, 5)
      : 0.3;

    const popularityScore = repo
      ? Math.min((repo.stargazersCount || 0) / 10000, 1) * 0.3
      : 0.3;

    const healthScore = repo?.communityHealthScore || 0.5;

    const issueBonus = isIssue && candidate.labels?.some((l: string) =>
      l.toLowerCase().includes('good first issue') || l.toLowerCase().includes('help wanted')
    ) ? 0.2 : 0;

    const diffPenalty = this.difficultyPenalty(candidate, developer, isIssue);

    const totalScore = Math.max(0, Math.min(1,
      skillScore * 0.35 +
      domainScore * 0.25 +
      popularityScore * 0.15 +
      healthScore * 0.1 +
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

    const levelRank = { beginner: 0, intermediate: 1, advanced: 2 };
    const devRank = levelRank[devLevel as keyof typeof levelRank] ?? 0;
    const candRank = levelRank[candDifficulty as keyof typeof levelRank] ?? 0;

    // Penalize if candidate is too hard relative to developer
    if (candRank > devRank + 1) return 0.15;
    // Bonus if candidate is a good stretch (one level above)
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

    // Repo difficulty inferred from size/activity
    if (candidate.difficultyLabel) return candidate.difficultyLabel;
    const stars = candidate.stargazersCount || 0;
    const contribs = candidate.activeContributorCount || 0;
    if (stars < 100 || contribs < 5) return 'beginner';
    if (stars < 5000 || contribs < 30) return 'intermediate';
    return 'advanced';
  }
}
