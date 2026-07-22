import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepo } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { MlService } from '../ml/ml.service';

@Injectable()
export class GithubIngestionService {
  private readonly logger = new Logger(GithubIngestionService.name);
  private readonly client: AxiosInstance;

  constructor(
    private config: ConfigService,
    @InjectRepository(Repository)
    private repoRepo: TypeOrmRepo<Repository>,
    @InjectRepository(Issue)
    private issueRepo: TypeOrmRepo<Issue>,
    private mlService: MlService,
  ) {
    const apiBase = this.config.get('api.github.apiBase')!;
    const token = this.config.get('api.github.token')!;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    this.client = axios.create({
      baseURL: apiBase,
      headers,
    });
  }

  async ingestRepository(fullName: string) {
    this.logger.log(`Ingesting repository: ${fullName}`);

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
        stargazersCount: data.stargazers_count,
        forksCount: data.forks_count,
        openIssuesCount: data.open_issues_count,
        hasCodeOfConduct: !!data.code_of_conduct,
      });

      await this.repoRepo.save(repo);

      // Generate embedding for the repo
      await this.generateRepoEmbedding(repo);

      // Fetch additional metadata (contributing guide, community health)
      await this.enrichRepository(repo, fullName);

      this.logger.log(`Successfully ingested: ${fullName}`);
      return repo;
    } catch (error) {
      this.logger.error(`Failed to ingest repository ${fullName}`, error);
      throw error;
    }
  }

  /**
   * Generate and persist vector embedding for a repository.
   */
  private async generateRepoEmbedding(repo: Repository) {
    try {
      const text = this.mlService.buildRepoText(repo);
      if (!text) return;
      const embedding = await this.mlService.embedText(text);
      await this.repoRepo.update(repo.id, { embeddings: embedding as any });
      this.logger.debug(`Generated embedding for ${repo.fullName}`);
    } catch (e) {
      this.logger.warn(`Failed to generate embedding for ${repo.fullName}, skipping`, e);
    }
  }

  private async enrichRepository(repo: Repository, fullName: string) {
    try {
      const { data: contents } = await this.client.get(`/repos/${fullName}/contents`, {
        params: { ref: 'HEAD' },
      });
      const hasContributing = contents.some(
        (f: any) => f.name.toLowerCase().includes('contributing'),
      );
      repo.hasContributingGuide = hasContributing;
      await this.repoRepo.save(repo);
    } catch (e) {
      this.logger.warn(`Failed to enrich ${repo.fullName}: ${e instanceof Error ? e.message : e}`);
    }
  }

  async ingestIssues(fullName: string, labels?: string[]) {
    this.logger.log(`Ingesting issues for: ${fullName}`);

    const repo = await this.repoRepo.findOneBy({ fullName });
    if (!repo) {
      throw new Error(`Repository ${fullName} not found. Ingest repo first.`);
    }

    const params: Record<string, any> = { state: 'open', per_page: 100 };
    if (labels?.length) params.labels = labels.join(',');

    try {
      const { data: issues } = await this.client.get(`/repos/${fullName}/issues`, { params });

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
      this.logger.log(`Ingested ${entities.length} issues for ${fullName}`);
      return { count: entities.length };
    } catch (error) {
      this.logger.error(`Failed to ingest issues for ${fullName}`, error);
      throw error;
    }
  }

  private inferDifficulty(issue: any): string | undefined {
    const labels = issue.labels?.map((l: any) => l.name.toLowerCase()) || [];
    if (labels.some((l: string) => l.includes('good first issue') || l.includes('beginner') || l.includes('easy'))) {
      return 'beginner';
    }
    if (labels.some((l: string) => l.includes('intermediate') || l.includes('medium'))) {
      return 'intermediate';
    }
    if (labels.some((l: string) => l.includes('advanced') || l.includes('hard') || l.includes('complex'))) {
      return 'advanced';
    }
    return undefined;
  }
}
