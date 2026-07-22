import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepo } from 'typeorm';
import axios from 'axios';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { MlService } from '../ml/ml.service';
import { IngestionJob } from './ingestion-queue.service';

@Processor('ingestion', {
  concurrency: 3, // max 3 concurrent GitHub API calls
  limiter: {
    max: 30, // max 30 jobs per 60 seconds (well under GitHub's 60/hr unauthed, 5000/hr authed)
    duration: 60_000,
  },
})
export class IngestionWorker extends WorkerHost {
  private readonly logger = new Logger(IngestionWorker.name);
  private readonly client;

  constructor(
    private config: ConfigService,
    @InjectRepository(Repository)
    private repoRepo: TypeOrmRepo<Repository>,
    @InjectRepository(Issue)
    private issueRepo: TypeOrmRepo<Issue>,
    private mlService: MlService,
  ) {
    super();
    const apiBase = this.config.get('api.github.apiBase')!;
    const token = this.config.get('api.github.token')!;
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    this.client = axios.create({ baseURL: apiBase, headers });
  }

  async process(job: Job<IngestionJob>) {
    const { type, repoFullName } = job.data;

    switch (type) {
      case 'repo':
        await this.ingestRepository(repoFullName, job);
        break;
      case 'issues':
        await this.ingestIssues(repoFullName, job);
        break;
    }
  }

  private async ingestRepository(fullName: string, job: Job) {
    this.logger.log(`[${job.id}] Ingesting repo: ${fullName}`);
    try {
      const { data } = await this.client.get(`/repos/${fullName}`);

      const repo = this.repoRepo.create({
        githubId: data.id,
        fullName: data.full_name,
        description: data.description,
        topics: data.topics || [],
        homepage: data.homepage,
        license: data.license?.spdx_id,
        primaryLanguage: data.language,
        secondaryLanguages: data.language ? [data.language] : [],
        domainTags: this.inferDomainTags(data),
        stargazersCount: data.stargazers_count,
        forksCount: data.forks_count,
        openIssuesCount: data.open_issues_count,
        hasCodeOfConduct: !!data.code_of_conduct,
        communityHealthScore: this.computeHealthScore(data),
        recentCommitFrequency: data.pushed_at ? 1 : 0,
      });

      await this.repoRepo.save(repo);
      await this.generateEmbedding(repo);

      // check for contributing guide
      try {
        const { data: contents } = await this.client.get(`/repos/${fullName}/contents`, {
          params: { ref: 'HEAD' },
        });
        repo.hasContributingGuide = contents.some((f: any) =>
          f.name.toLowerCase().includes('contributing'),
        );
        await this.repoRepo.save(repo);
      } catch { /* best-effort */ }

      this.logger.log(`[${job.id}] ✅ ${fullName} ingested (${(data.stargazers_count || 0)}★)`);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        this.logger.warn(`[${job.id}] ⚠️ Rate limited on ${fullName}, will retry`);
      } else if (error?.response?.status === 404) {
        this.logger.warn(`[${job.id}] ❌ ${fullName} not found, skipping`);
      } else {
        this.logger.error(`[${job.id}] ❌ Failed ${fullName}: ${error?.message}`);
      }
      throw error; // BullMQ will retry based on job opts
    }
  }

  private async ingestIssues(fullName: string, job: Job) {
    this.logger.log(`[${job.id}] Ingesting issues for: ${fullName}`);
    try {
      const repo = await this.repoRepo.findOneBy({ fullName });
      if (!repo) {
        this.logger.warn(`[${job.id}] Repo ${fullName} not found in DB, skipping issues`);
        return;
      }

      const { data: issues } = await this.client.get(`/repos/${fullName}/issues`, {
        params: { state: 'open', per_page: 100 },
      });

      const entities = issues
        .filter((i: any) => !i.pull_request)
        .map((i: any) =>
          this.issueRepo.create({
            githubId: i.id,
            repositoryId: repo.id,
            title: i.title,
            body: i.body,
            labels: i.labels.map((l: any) => l.name),
            state: i.state,
            commentCount: i.comments,
            difficultyHint: this.inferDifficulty(i),
          }),
        );

      await this.issueRepo.save(entities, { chunk: 50 });
      this.logger.log(`[${job.id}] ✅ ${entities.length} issues ingested for ${fullName}`);
    } catch (error: any) {
      this.logger.error(`[${job.id}] ❌ Issues failed for ${fullName}: ${error?.message}`);
      throw error;
    }
  }

  private async generateEmbedding(repo: Repository) {
    try {
      const parts: string[] = [];
      if (repo.description) parts.push(repo.description);
      if (repo.topics?.length) parts.push(`Topics: ${repo.topics.join(', ')}`);
      if (repo.primaryLanguage) parts.push(`Language: ${repo.primaryLanguage}`);
      const text = parts.join('\n');
      if (!text) return;
      const embedding = await this.mlService.embedText(text);
      await this.repoRepo.update(repo.id, { embeddings: embedding as any });
    } catch (e) {
      this.logger.warn(`Embedding failed for ${repo.fullName}, skipping`);
    }
  }

  private inferDomainTags(data: any): string[] {
    const tags = new Set<string>();
    const map: Record<string, string> = {
      react: 'frontend', vue: 'frontend', angular: 'frontend', svelte: 'frontend',
      css: 'frontend', ui: 'frontend', design: 'frontend',
      frontend: 'frontend', 'web-app': 'frontend',
      api: 'backend', server: 'backend', backend: 'backend', graphql: 'backend',
      'rest-api': 'backend', middleware: 'backend',
      database: 'database', sql: 'database', nosql: 'database',
      cli: 'devtools', devtools: 'devtools', compiler: 'devtools',
      'machine-learning': 'ml', 'deep-learning': 'ml', neural: 'ml', 'data-science': 'ml',
      analytics: 'data', visualization: 'data',
      mobile: 'mobile', ios: 'mobile', android: 'mobile',
      testing: 'testing', test: 'testing',
      security: 'security', auth: 'security', authentication: 'security',
      blockchain: 'blockchain', web3: 'blockchain', crypto: 'blockchain',
      devops: 'infrastructure', docker: 'infrastructure', kubernetes: 'infrastructure',
      docs: 'documentation', editor: 'devtools', electron: 'frontend',
      language: 'devtools', 'programming-language': 'devtools',
    };
    if (data.topics) for (const t of data.topics) {
      const l = t.toLowerCase();
      for (const [k, v] of Object.entries(map)) if (l.includes(k)) tags.add(v);
    }
    if (data.description) {
      const d = data.description.toLowerCase();
      if (d.includes('react') || d.includes('web ui') || d.includes('user interface')) tags.add('frontend');
      if (d.includes('rest api') || d.includes('http') || d.includes('server') || d.includes('backend') || d.includes('web framework')) tags.add('backend');
      if (d.includes('machine learning') || d.includes('deep learning') || d.includes('ai')) tags.add('ml');
      if (d.includes('database') || d.includes('storage engine')) tags.add('database');
      if (d.includes('cli') || d.includes('command line') || d.includes('terminal')) tags.add('devtools');
      if (d.includes('programming language') || d.includes('runtime') || d.includes('compiler')) tags.add('devtools');
    }
    // No language-based inference — too many false positives
    return [...tags];
  }

  private computeHealthScore(data: any): number {
    let s = 0.3;
    if (data.description?.length > 20) s += 0.1;
    if (data.topics?.length > 0) s += 0.1;
    if (data.license) s += 0.1;
    if (data.pushed_at && new Date(data.pushed_at) > new Date(Date.now() - 90 * 86400000)) s += 0.15;
    if (data.open_issues_count > 0 && data.forks_count > 0) s += 0.1;
    if (data.homepage) s += 0.05;
    if (data.stargazers_count > 1000) s += 0.1;
    if (data.stargazers_count > 10000) s += 0.1;
    return Math.min(Math.round(s * 100) / 100, 1);
  }

  private inferDifficulty(issue: any): string | undefined {
    const labels: string[] = issue.labels?.map((l: any) => l.name.toLowerCase()) || [];
    if (labels.some((l: string) => l.includes('good first') || l.includes('beginner') || l.includes('easy'))) return 'beginner';
    if (labels.some((l: string) => l.includes('intermediate') || l.includes('medium'))) return 'intermediate';
    if (labels.some((l: string) => l.includes('advanced') || l.includes('hard') || l.includes('complex'))) return 'advanced';
    return undefined;
  }
}
