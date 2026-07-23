import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepo } from 'typeorm';
import { Developer } from '../../database/entities/developer.entity';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { Recommendation } from '../../database/entities/recommendation.entity';
import { Feedback } from '../../database/entities/feedback.entity';
import { GithubService } from '../github/github.service';
import { MlService } from '../ml/ml.service';
import { QdrantService } from '../qdrant/qdrant.service';

interface TieredRecommendations {
  bestMatches: ScoredItem[];
  trending: ScoredItem[];
  hiddenGems: ScoredItem[];
}

export interface ScoredItem {
  repoId?: string;
  issueId?: string;
  title: string;
  url: string;
  score: number;
  tier: string;
  starCount: number;
  trendingScore: number | null;
  matchReason: string;
  healthScore: number;
  suggestedNextSteps: string[];
  reasons: string[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Developer)
    private developerRepo: TypeOrmRepo<Developer>,
    @InjectRepository(Repository)
    private repoRepo: TypeOrmRepo<Repository>,
    @InjectRepository(Issue)
    private issueRepo: TypeOrmRepo<Issue>,
    @InjectRepository(Recommendation)
    private recRepo: TypeOrmRepo<Recommendation>,
    @InjectRepository(Feedback)
    private feedbackRepo: TypeOrmRepo<Feedback>,
    private githubService: GithubService,
    private mlService: MlService,
    private qdrant: QdrantService,
  ) {}

  async recommend(input: {
    developerId?: string;
    githubUsername?: string;
    context?: {
      timeAvailableHoursPerWeek?: number;
      focus?: 'repos' | 'issues';
      maxResults?: number;
    };
  }) {
    const focus = input.context?.focus || 'repos';
    const maxResults = input.context?.maxResults || 10;

    // 1. Resolve developer
    const developer = await this.resolveDeveloper(input.developerId, input.githubUsername);
    if (!developer) {
      return {
        developerSummary: 'New developer — profile will be built as you use the platform.',
        bestMatches: [],
        trending: [],
        hiddenGems: [],
      };
    }

    const devSummary = this.buildSummary(developer);

    // 2. Embed developer
    const devText = this.mlService.buildDeveloperText(developer);
    let devEmbedding: number[];
    try {
      devEmbedding = await this.mlService.embedText(devText);
    } catch {
      return {
        developerSummary: devSummary,
        bestMatches: [],
        trending: [],
        hiddenGems: [],
      };
    }

    // 3. Tiered retrieval from Qdrant
    const popular = await this.safeSearch(devEmbedding, 'popular', 20);
    const mid = await this.safeSearch(devEmbedding, 'mid', 20);
    const niche = await this.safeSearch(devEmbedding, 'niche', 30);

    // 4. Build repo text map for cross-encoder reranking
    const allByTier: Record<string, { id: string; score: number; payload: any }[]> = {
      popular, mid, niche,
    };

    // 5. Cross-encoder rerank each tier independently
    const reranked: Record<string, ScoredItem[]> = {};
    for (const [tier, points] of Object.entries(allByTier)) {
      const texts = points.map((p) => this.buildTextFromPayload(p.payload));
      const ids = points.map((p) => p.id);

      let ceScores: number[] | null = null;
      try {
        const result = await this.mlService.rerank(devText, texts);
        // result.reranked_scores are raw cross-encoder scores
        // Normalize to [0, 1] within this tier batch
        const rawScores: number[] = new Array(ids.length).fill(0);
        for (let i = 0; i < result.indices.length; i++) {
          rawScores[result.indices[i]] = result.reranked_scores[i];
        }
        // Min-max normalize to [0, 1]
        const min = Math.min(...rawScores);
        const max = Math.max(...rawScores);
        if (max - min > 0.001) {
          ceScores = rawScores.map(s => (s - min) / (max - min));
        } else {
          ceScores = rawScores.map(() => 0.5);
        }
      } catch (e) {
        this.logger.warn(`Rerank failed for ${tier} tier, using bi-encoder scores`, e);
      }

      const items: ScoredItem[] = points.map((p, i) => {
        const biScore = p.score;
        const rawCeScore = ceScores?.[i] ?? biScore;
        // Cross-encoder scores can be strict; floor at 60% of bi-encoder score
        // so retrieval signal is never fully suppressed by reranking
        const ceScore = Math.max(rawCeScore, biScore * 0.6);
        const combined = tier === 'niche'
          ? biScore * 0.3 + ceScore * 0.7
          : biScore * 0.4 + ceScore * 0.6;
        const stars = p.payload.stargazersCount || 0;
        const health = p.payload.communityHealthScore || 0;
        const trendingScore = p.payload.trendingScore || 0;
        const lang = p.payload.primaryLanguage || '';
        const domains = p.payload.domainTags || [];

        return {
          repoId: p.id,
          title: p.payload.fullName || 'Unknown',
          url: `https://github.com/${p.payload.fullName || ''}`,
          score: Math.max(0, Math.min(1, combined)),
          tier,
          starCount: stars,
          trendingScore,
          healthScore: health,
          matchReason: this.buildMatchReason(lang, domains, devText),
          suggestedNextSteps: [
            'Read CONTRIBUTING.md and setup docs.',
            'Start with a small docs or test improvement to get familiar.',
            'Join the community: check for Discord/Slack links in the README.',
          ],
          reasons: [
            `${stars > 0 ? `${stars.toLocaleString()} stars ` : ''}` +
            `• ${health > 0.7 ? 'Strong' : 'Good'} community health`,
          ],
        };
      });

      // Sort by combined score
      items.sort((a, b) => b.score - a.score);
      reranked[tier] = items;
    }

    // 6. Assemble three-section response
    const bestMatches = [
      ...reranked.popular.slice(0, 3),
      ...reranked.mid.slice(0, 3),
    ].slice(0, maxResults);

    // Trending: niche with trendingScore > threshold
    const trending = reranked.niche
      .filter((r) => r.trendingScore && r.trendingScore > 0.1)
      .slice(0, 4);

    // Hidden gems: niche, NOT trending, highest score
    const trendingIds = new Set(trending.map((r) => r.repoId));
    const hiddenGems = reranked.niche
      .filter((r) => !trendingIds.has(r.repoId))
      .slice(0, 4);

    // 7. Persist recommendations
    await this.persistRecommendations(developer.id, [...bestMatches, ...trending, ...hiddenGems], 'repo');

    return {
      developerSummary: devSummary,
      bestMatches,
      trending,
      hiddenGems,
    };
  }

  private async safeSearch(
    vector: number[],
    tier: 'popular' | 'mid' | 'niche',
    limit: number,
  ) {
    try {
      return await this.qdrant.searchByTier(vector, tier, undefined, limit);
    } catch (e) {
      this.logger.warn(`Qdrant search for ${tier} failed`, e);
      return [];
    }
  }

  private buildTextFromPayload(p: any): string {
    const parts: string[] = [];
    if (p.description) parts.push(p.description);
    if (p.topics?.length) parts.push(`Topics: ${(p.topics as string[]).join(', ')}`);
    if (p.primaryLanguage) parts.push(`Language: ${p.primaryLanguage}`);
    return parts.join('\n');
  }

  private buildMatchReason(lang: string, domains: string[], devText: string): string {
    const devLang = devText.match(/Languages: ([\w#, ]+)/);
    const devDom = devText.match(/Domains: ([\w#, /]+)/);
    const parts: string[] = [];
    if (lang && devLang?.[1]?.toLowerCase().includes(lang.toLowerCase())) {
      parts.push(`matches your ${lang} experience`);
    }
    if (domains.length > 0 && devDom?.[1]) {
      const overlap = domains.filter((d) =>
        devDom[1].toLowerCase().includes(d.toLowerCase()),
      );
      if (overlap.length > 0) parts.push(`aligns with ${overlap[0]}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'semantically similar to your profile';
  }

  private async resolveDeveloper(
    developerId?: string,
    githubUsername?: string,
  ): Promise<Developer | null> {
    let developer: Developer | null = null;
    if (developerId) {
      developer = await this.developerRepo.findOneBy({ id: developerId });
    }
    if (!developer && githubUsername) {
      // Check DB first before hitting GitHub API
      developer = await this.developerRepo.findOneBy({
        githubUsername,
      });

      if (!developer) {
        try {
          const profile = await this.githubService.fetchDeveloperProfile(githubUsername);
          developer = await this.developerRepo.save(
            this.developerRepo.create({
              githubUsername: profile.githubUsername,
              bio: profile.bio,
              location: profile.location,
              avatarUrl: profile.avatarUrl,
              skills: profile.skills as any,
              interests: profile.interests,
              goals: profile.goals,
              constraints: profile.constraints,
            }),
          );
        } catch (e) {
          this.logger.warn(`Could not fetch GitHub profile for ${githubUsername}, using cached data`, e);
          return developer; // null
        }
      } else {
        // Update existing record with latest GitHub data (best-effort)
        try {
          const profile = await this.githubService.fetchDeveloperProfile(githubUsername);
          developer.bio = profile.bio;
          developer.location = profile.location;
          developer.avatarUrl = profile.avatarUrl;
          developer.skills = profile.skills as any;
          developer.interests = profile.interests;
          developer.goals = profile.goals;
          developer.constraints = profile.constraints;
          developer = await this.developerRepo.save(developer);
        } catch {
          // Non-fatal, existing data is fine
          this.logger.warn(`Could not refresh GitHub profile for ${githubUsername}, using cached data`);
        }
      }
    }
    return developer;
  }

  private async persistRecommendations(
    developerId: string,
    items: ScoredItem[],
    type: 'repo' | 'issue',
  ) {
    if (!items.length) return;
    const recommendations = items.map((item) =>
      this.recRepo.create({
        developerId,
        repositoryId: item.repoId,
        matchScore: item.score,
        matchReasons: item.reasons,
        fitSignals: {
          skillOverlap: [],
          domainOverlap: [],
          difficulty: 'intermediate',
          communityHealth: item.healthScore > 0.7 ? 'high' : 'medium',
          goalAlignment: [],
        },
        suggestedSteps: item.suggestedNextSteps,
        type,
      }),
    );
    await this.recRepo.save(recommendations, { chunk: 50 });
  }

  async recordFeedback(input: {
    recommendationId: string;
    rating?: number;
    clickedThrough?: boolean;
    openedPr?: boolean;
    comments?: string;
  }) {
    const rec = await this.recRepo.findOne({
      where: { id: input.recommendationId },
      relations: ['developer'],
    });
    if (!rec) throw new Error('Recommendation not found');

    await this.feedbackRepo.save({
      developerId: rec.developerId,
      recommendationId: rec.id,
      rating: input.rating,
      clickedThrough: input.clickedThrough || false,
      openedPr: input.openedPr || false,
      comments: input.comments,
    });

    if (input.rating && input.rating >= 4) {
      await this.recRepo.update(rec.id, { feedback: 'positive' });
    } else if (input.rating && input.rating <= 2) {
      await this.recRepo.update(rec.id, { feedback: 'negative' });
    }

    return { status: 'recorded' };
  }

  async getRecommendationHistory(developerId: string, limit: number) {
    return this.recRepo.find({
      where: { developerId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['repository', 'issue'],
    });
  }

  private buildSummary(dev: Developer): string {
    const skills = dev.skills as any;
    const langs = skills?.languages?.slice(0, 3).join(', ') || 'unknown languages';
    const domains = skills?.domains?.slice(0, 2).join(', ') || 'various domains';
    const level = skills?.experienceLevel || 'beginner';
    const goals = dev.goals?.length ? dev.goals.slice(0, 2).join(' and ') : 'explore new projects';
    return `${level} developer with ${langs}, interested in ${domains}. Aims to ${goals}.`;
  }
}
