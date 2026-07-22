import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface IngestionJob {
  type: 'repo' | 'issues';
  repoFullName: string;
  labels?: string[];
}

@Injectable()
export class IngestionQueueService {
  constructor(@InjectQueue('ingestion') private readonly queue: Queue) {}

  /**
   * Queue a repository for ingestion. Returns immediately.
   * The worker processes it asynchronously.
   */
  async queueRepoIngestion(repoFullName: string) {
    const job = await this.queue.add(
      'ingest-repo',
      { type: 'repo', repoFullName } as IngestionJob,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 3600 * 24 }, // keep results 24h
        removeOnFail: { age: 3600 * 24 * 7 }, // keep failures 7d
      },
    );
    return { queued: true, jobId: job.id, repoFullName };
  }

  /**
   * Queue issues ingestion for a repository.
   */
  async queueIssuesIngestion(repoFullName: string, labels?: string[]) {
    const job = await this.queue.add(
      'ingest-issues',
      { type: 'issues', repoFullName, labels } as IngestionJob,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 3600 * 24 },
        removeOnFail: { age: 3600 * 24 * 7 },
      },
    );
    return { queued: true, jobId: job.id, repoFullName };
  }

  /**
   * Queue bulk ingestion of multiple repos with controlled concurrency.
   */
  async queueBulkIngestion(repos: string[]) {
    const jobs = repos.map((repoFullName) => ({
      name: 'ingest-repo' as const,
      data: { type: 'repo' as const, repoFullName },
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }));

    await this.queue.addBulk(jobs);
    return { queued: true, count: repos.length };
  }
}
