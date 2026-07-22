import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepo } from 'typeorm';
import { Developer } from '../../database/entities/developer.entity';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { Recommendation } from '../../database/entities/recommendation.entity';
import { Feedback } from '../../database/entities/feedback.entity';
import { MatchingEngine } from './matching-engine.service';
import { GithubService } from '../github/github.service';
import { MlService } from '../ml/ml.service';

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
    private matchingEngine: MatchingEngine,
    private githubService: GithubService,
    private mlService: MlService,
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
    const maxResults = input.context?.maxResults || 6;
    const focus = input.context?.focus || 'repos';

    // 1. Resolve developer
    let developer: Developer | null = null;
    if (input.developerId) {
      developer = await this.developerRepo.findOneBy({ id: input.developerId });
    }
    if (!developer && input.githubUsername) {
      const profile = await this.githubService.fetchDeveloperProfile(input.githubUsername);

      // Check if developer already exists by username (upsert)
      let existing = await this.developerRepo.findOneBy({
        githubUsername: profile.githubUsername,
      });

      if (existing) {
        // Update existing
        existing.bio = profile.bio;
        existing.location = profile.location;
        existing.avatarUrl = profile.avatarUrl;
        existing.skills = profile.skills as any;
        existing.interests = profile.interests;
        existing.goals = profile.goals;
        existing.constraints = profile.constraints;
        developer = await this.developerRepo.save(existing);
      } else {
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
      }
    }

    if (!developer) {
      return {
        developerSummary: 'New developer — profile will be built as you use the platform.',
        recommendations: [],
      };
    }

    // 2. Build developer summary
    const devSummary = this.buildSummary(developer);

    // 3. Find candidates
    const candidates = focus === 'issues'
      ? await this.findIssueCandidates(developer)
      : await this.findRepoCandidates(developer);

    if (candidates.length === 0) {
      return {
        developerSummary: devSummary,
        recommendations: [],
      };
    }

    // 4. Score — try hybrid (ML + rules), fall back to pure rules
    let scored = await this.matchingEngine.scoreHybrid(
      developer, candidates, focus,
      async (dev, repos) => this.computeMlSimilarities(dev, repos),
    );

    // If hybrid produced all zeros (ML down), fall back
    if (!scored.length || scored.every((s) => s.score === 0)) {
      scored = this.matchingEngine.score(developer, candidates, focus);
    }

    // 5. Format top results
    const topResults = scored.slice(0, maxResults);

    // 6. Persist recommendations
    const recommendations = topResults.map((result) =>
      this.recRepo.create({
        developerId: developer!.id,
        ...(focus === 'issues'
          ? { issueId: result.issueId, repositoryId: result.issueRepositoryId }
          : { repositoryId: result.repoId }),
        matchScore: result.score,
        matchReasons: result.reasons,
        fitSignals: result.fitSignals as any,
        suggestedSteps: result.suggestedNextSteps,
        type: focus === 'issues' ? 'issue' : 'repo',
      }),
    );

    if (recommendations.length > 0) {
      await this.recRepo.save(recommendations, { chunk: 50 });
    }

    return {
      developerSummary: devSummary,
      recommendations: topResults,
    };
  }

  /**
   * Build developer embedding, embed repo texts, then compute cosine similarities.
   * Returns a scores array parallel to `repos` or empty array on failure.
   */
  private async computeMlSimilarities(developer: any, repos: any[]): Promise<number[]> {
    if (!repos.length) return [];

    try {
      // 1. Embed developer
      const devText = this.mlService.buildDeveloperText(developer);
      if (!devText) return [];
      const devEmbedding = await this.mlService.embedText(devText);

      // 2. Embed repos — prefer stored embeddings, fall back to on-the-fly
      const repoEmbeddings: (number[] | null)[] = new Array(repos.length).fill(null);
      const needEmbed: { repo: any; index: number }[] = [];

      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        if (repo.embeddings?.length === 384) {
          repoEmbeddings[i] = repo.embeddings;
        } else {
          needEmbed.push({ repo, index: i });
        }
      }

      // Embed any repos that don't have stored vectors
      if (needEmbed.length > 0) {
        const texts = needEmbed.map(({ repo }) => this.mlService.buildRepoText(repo));
        const embeddings = await this.mlService.embedBatch(texts);
        for (let j = 0; j < needEmbed.length; j++) {
          repoEmbeddings[needEmbed[j].index] = embeddings[j] ?? new Array(384).fill(0);
        }
      }

      // Separate repos with and without embeddings
      const withEmbed: { embedding: number[]; index: number }[] = [];
      for (let i = 0; i < repoEmbeddings.length; i++) {
        const emb = repoEmbeddings[i];
        if (emb) {
          withEmbed.push({ embedding: emb, index: i });
        }
      }

      if (!withEmbed.length) return [];

      // Compute similarities for repos that have embeddings
      const batchScores = await this.mlService.computeSimilarities(
        devEmbedding,
        withEmbed.map((w) => w.embedding),
      );

      // Reconstruct full-length scores array (-1 for repos without embeddings)
      const scores: number[] = new Array(repos.length).fill(-1);
      for (let k = 0; k < withEmbed.length; k++) {
        scores[withEmbed[k].index] = batchScores[k];
      }

      return scores;
    } catch (e) {
      this.logger.warn('computeMlSimilarities failed, rule-based fallback', e);
      return [];
    }
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

  private async findRepoCandidates(developer: Developer) {
    const recommendedIds = await this.recRepo.find({
      where: { developerId: developer.id, type: 'repo' },
      select: ['repositoryId'],
    });
    const excludeIds = recommendedIds.map((r) => r.repositoryId).filter(Boolean) as string[];

    const query = this.repoRepo
      .createQueryBuilder('r')
      .where('r.stargazersCount > 10')
      .andWhere('r.communityHealthScore >= 0')
      .orderBy('r.stargazersCount', 'DESC')
      .take(200);

    if (excludeIds.length > 0) {
      query.andWhere('r.id NOT IN (:...excludeIds)', { excludeIds });
    }

    return query.getMany();
  }

  private async findIssueCandidates(developer: Developer) {
    const recommendedIds = await this.recRepo.find({
      where: { developerId: developer.id, type: 'issue' },
      select: ['issueId'],
    });
    const excludeIds = recommendedIds.map((r) => r.issueId).filter(Boolean) as string[];

    const query = this.issueRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.repository', 'r')
      .where('i.state = :state', { state: 'open' })
      .orderBy('i.commentCount', 'ASC')
      .take(200);

    if (excludeIds.length > 0) {
      query.andWhere('i.id NOT IN (:...excludeIds)', { excludeIds });
    }

    return query.getMany();
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
