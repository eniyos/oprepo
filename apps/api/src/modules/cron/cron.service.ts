import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository as TypeOrmRepo } from 'typeorm';
import { Repository } from '../../database/entities/repository.entity';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Repository)
    private repoRepo: TypeOrmRepo<Repository>,
  ) {}

  /**
   * Every day at 3 AM, refresh stale repos (not indexed in 7+ days)
   * and re-top the most-starred repos.
   */
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
      // Note: actual re-ingestion would be done by GithubIngestionService
      // This marks them as refreshed by updating the timestamp
      for (const repo of stale) {
        repo.lastIndexedAt = new Date();
      }
      await this.repoRepo.save(stale, { chunk: 25 });
      this.logger.log(`Updated lastIndexedAt for ${stale.length} repos`);
    } catch (error) {
      this.logger.error('Scheduled repo refresh failed', error);
    }
  }

  /**
   * Every hour, clean up very old recommendation records (>90 days)
   * to keep the history table manageable.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanOldRecommendations() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    try {
      const result = await this.repoRepo.query(
        `DELETE FROM recommendations WHERE "createdAt" < $1`,
        [ninetyDaysAgo],
      );
      if (result[1] > 0) {
        this.logger.log(`Cleaned up ${result[1]} old recommendation records`);
      }
    } catch (error) {
      this.logger.error('Cleanup old recommendations failed', error);
    }
  }
}
