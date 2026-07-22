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
      // Try to fetch from GitHub
      const profile = await this.githubService.fetchDeveloperProfile(input.githubUsername);
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

    if (!developer) {
      return {
        developerSummary: 'New developer — profile will be built as you use the platform.',
        recommendations: [],
      };
    }

    // 2. Build developer summary
    const devSummary = this.buildSummary(developer);

    // 3. Find candidates and score
    const candidates = focus === 'issues'
      ? await this.findIssueCandidates(developer)
      : await this.findRepoCandidates(developer);

    const scored = this.matchingEngine.score(developer, candidates, focus);

    // 4. Format top results
    const topResults = scored.slice(0, maxResults);

    // 5. Persist recommendations
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

    // Update recommendation feedback status
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
    // Get repos not already recommended to this developer
    const recommendedIds = await this.recRepo.find({
      where: { developerId: developer.id, type: 'repo' },
      select: ['repositoryId'],
    });
    const excludeIds = recommendedIds.map((r) => r.repositoryId).filter(Boolean) as string[];

    const query = this.repoRepo
      .createQueryBuilder('r')
      .where('r.stargazersCount > 10')
      .andWhere('r.communityHealthScore > 0')
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
