import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepo } from 'typeorm';
import axios from 'axios';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';

@Injectable()
export class GithubIngestionService {
  private readonly logger = new Logger(GithubIngestionService.name);
  private readonly apiBase: string;
  private readonly token: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(Repository)
    private repoRepo: TypeOrmRepo<Repository>,
    @InjectRepository(Issue)
    private issueRepo: TypeOrmRepo<Issue>,
  ) {
    this.apiBase = this.config.get('api.github.apiBase')!;
    this.token = this.config.get('api.github.token')!;
  }

  private get client() {
    return axios.create({
      baseURL: this.apiBase,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
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

      // Fetch additional metadata (contributing guide, community health)
      await this.enrichRepository(repo, fullName);

      this.logger.log(`Successfully ingested: ${fullName}`);
      return repo;
    } catch (error) {
      this.logger.error(`Failed to ingest repository ${fullName}`, error);
      throw error;
    }
  }

  private async enrichRepository(repo: Repository, fullName: string) {
    try {
      // Check for CONTRIBUTING.md
      const { data: contents } = await this.client.get(`/repos/${fullName}/contents`, {
        params: { ref: 'HEAD' },
      });
      const hasContributing = contents.some(
        (f: any) => f.name.toLowerCase().includes('contributing'),
      );
      repo.hasContributingGuide = hasContributing;
      await this.repoRepo.save(repo);
    } catch {
      // enrichment is best-effort
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
        .filter((i: any) => !i.pull_request) // exclude PRs
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
