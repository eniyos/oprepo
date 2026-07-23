import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository as TypeOrmRepo } from 'typeorm';
import { Repository } from '../../database/entities/repository.entity';
import { Recommendation } from '../../database/entities/recommendation.entity';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Repository)
    private repoRepo: TypeOrmRepo<Repository>,
    @InjectRepository(Recommendation)
    private recRepo: TypeOrmRepo<Recommendation>,
    private qdrant: QdrantService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async refreshStaleRepos() {
    this.logger.log('Running scheduled repo refresh...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const stale = await this.repoRepo.find({
        where: [
          { lastIndexedAt: LessThan(sevenDaysAgo) },
          { lastIndexedAt: IsNull() },
        ],
        order: { stargazersCount: 'DESC' },
        take: 50,
      });

      this.logger.log(`Found ${stale.length} stale repos to refresh`);
      for (const repo of stale) {
        repo.lastIndexedAt = new Date();
      }
      await this.repoRepo.save(stale, { chunk: 25 });
      this.logger.log(`Updated lastIndexedAt for ${stale.length} repos`);
    } catch (error) {
      this.logger.error('Scheduled repo refresh failed', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanOldRecommendations() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    try {
      const result = await this.recRepo.query(
        `DELETE FROM recommendations WHERE "createdAt" < $1`,
        [ninetyDaysAgo],
      );
      if (result.rowCount && result.rowCount > 0) {
        this.logger.log(`Cleaned up ${result.rowCount} old recommendation records`);
      }
    } catch (error) {
      this.logger.error('Cleanup old recommendations failed', error);
    }
  }

  /**
   * Weekly trending score update: queries GitHub API to get current star
   * counts, then computes trending_score = (current - last) / last and
   * updates the Qdrant point payload.
   *
   * Runs every Saturday at 2 AM.
   */
  @Cron('0 2 * * 6')
  async updateTrendingScores() {
    this.logger.log('Updating trending scores...');

    try {
      let offset: string | undefined;
      let updated = 0;

      do {
        const { points, nextOffset } = await this.qdrant.scrollAll(100, offset);

        for (const point of points) {
          // Ensure the backend gets the GitHub token
          const token = process.env.GITHUB_TOKEN;
          if (!token) {
            this.logger.warn('No GITHUB_TOKEN set, skipping trending update');
            return;
          }

          const fullName = point.payload?.fullName as string | undefined;
          if (!fullName) continue;

          try {
            const response = await fetch(
              `https://api.github.com/repos/${fullName}`,
              { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } },
            );
            if (!response.ok) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: any = await response.json();
            const currentStars = data.stargazers_count;
            const lastStars = (point.payload.lastStarSnapshot as number) ?? currentStars;
            const delta = currentStars - lastStars;

            const trendingScore = lastStars > 0 ? delta / lastStars : 0;

            await this.qdrant.client.setPayload('repositories', {
              payload: {
                stargazersCount: currentStars,
                lastStarSnapshot: currentStars,
                trendingScore,
              },
              points: [point.id],
            });

            updated++;
          } catch {
            // Individual repo failures are non-fatal
          }
        }

        offset = nextOffset;
      } while (offset);

      this.logger.log(`Updated trending scores for ${updated} repos`);
    } catch (error) {
      this.logger.error('Trending score update failed', error);
    }
  }
}
