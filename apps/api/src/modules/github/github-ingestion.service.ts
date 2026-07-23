import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepo } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { MlService } from '../ml/ml.service';
import { QdrantService } from '../qdrant/qdrant.service';

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
    private qdrant: QdrantService,
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
   * Generate and persist vector embedding to Qdrant instead of pgvector.
   */
  private async generateRepoEmbedding(repo: Repository) {
    try {
      const text = this.mlService.buildRepoText(repo);
      if (!text) return;
      const embedding = await this.mlService.embedText(text);
      if (!embedding || embedding.length !== 384) return;

      // Determine tier based on stars
      const tier =
        repo.stargazersCount > 5000
          ? 'popular'
          : repo.stargazersCount > 500
            ? 'mid'
            : 'niche';

      await this.qdrant.upsertPoint(repo.id, embedding, {
        fullName: repo.fullName,
        description: repo.description,
        topics: repo.topics,
        domainTags: repo.domainTags,
        primaryLanguage: repo.primaryLanguage,
        secondaryLanguages: repo.secondaryLanguages,
        stargazersCount: repo.stargazersCount,
        forksCount: repo.forksCount,
        openIssuesCount: repo.openIssuesCount,
        communityHealthScore: repo.communityHealthScore,
        hasContributingGuide: repo.hasContributingGuide,
        hasCodeOfConduct: repo.hasCodeOfConduct,
        license: repo.license,
        homepage: repo.homepage,
        tier,
        trendingScore: 0,
        lastStarSnapshot: repo.stargazersCount,
      });

      this.logger.debug(`Upserted Qdrant point for ${repo.fullName} (tier: ${tier})`);
    } catch (e) {
      this.logger.warn(`Failed to generate/upsert embedding for ${repo.fullName}, skipping`, e);
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
      const allIssues: any[] = [];
      let page = 1;
      let hasMoreResults = true;
      
      // Paginate issues - continue while there are more results available
      while (hasMoreResults) {
        const { data: issues } = await this.client.get(`/repos/${fullName}/issues`, { params: { ...params, page } });
        
        if (!issues.length) {
          hasMoreResults = false;
        } else {
          allIssues.push(...issues);
          // If we got fewer than max per page, this is the last page
          if (issues.length < 100) {
            hasMoreResults = false;
          } else {
            page++;
          }
        }
      }

      const entities = allIssues
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

  /**
   * Infer domain tags from repo description, topics, and language.
   */
  private inferDomainTags(data: any): string[] {
    const tags = new Set<string>();
    const topicDomains: Record<string, string> = {
      react: 'frontend', vue: 'frontend', angular: 'frontend', svelte: 'frontend',
      css: 'frontend', ui: 'frontend', design: 'frontend',
      api: 'backend', server: 'backend', backend: 'backend', graphql: 'backend',
      database: 'database', db: 'database', sql: 'database', nosql: 'database',
      cli: 'devtools', devtools: 'devtools', developer: 'devtools',
      machine: 'ml', 'machine-learning': 'ml', ai: 'ml', 'deep-learning': 'ml',
      data: 'data', analytics: 'data', visualization: 'data',
      mobile: 'mobile', ios: 'mobile', android: 'mobile',
      testing: 'testing', test: 'testing', 'unit-test': 'testing',
      security: 'security', auth: 'security',
      blockchain: 'blockchain', web3: 'blockchain', crypto: 'blockchain',
      devops: 'infrastructure', docker: 'infrastructure', kubernetes: 'infrastructure', deploy: 'infrastructure',
      docs: 'documentation', documentation: 'documentation',
    };

    // From topics
    if (data.topics) {
      for (const topic of data.topics) {
        const lower = topic.toLowerCase();
        for (const [key, domain] of Object.entries(topicDomains)) {
          if (lower.includes(key)) tags.add(domain);
        }
      }
    }

      // From description
    if (data.description) {
      const desc = data.description.toLowerCase();
      if (desc.includes('react') || desc.includes('ui') || desc.includes('component')) tags.add('frontend');
      if (desc.includes('api') || desc.includes('server') || desc.includes('backend')) tags.add('backend');
      if (desc.includes('machine learning') || desc.includes('ai') || desc.includes('neural')) tags.add('ml');
      if (desc.includes('database') || desc.includes('storage')) tags.add('database');
      if (desc.includes('cli') || desc.includes('command line')) tags.add('devtools');
    }

    // From language
    if (data.language) {
      const lang = data.language.toLowerCase();
      if (['javascript', 'typescript', 'css', 'html'].includes(lang)) tags.add('frontend');
      if (['python', 'go', 'rust', 'java', 'c#', 'ruby', 'php'].includes(lang)) tags.add('backend');
      if (['python', 'r'].includes(lang)) tags.add('data');
    }

    return [...tags];
  }

  /**
   * Compute a community health score (0-1) from repo metadata.
   */
  private computeHealthScore(data: any): number {
    let score = 0.3; // base

    // Has description
    if (data.description && data.description.length > 20) score += 0.1;

    // Has topics
    if (data.topics && data.topics.length > 0) score += 0.1;

    // Has license
    if (data.license) score += 0.1;

    // Recent activity (pushed within 3 months)
    if (data.pushed_at) {
      const pushed = new Date(data.pushed_at);
      const threeMonths = new Date();
      threeMonths.setMonth(threeMonths.getMonth() - 3);
      if (pushed > threeMonths) score += 0.15;
    }

    // Good ratio of closed to open issues indicates active maintenance
    if (data.open_issues_count > 0 && data.forks_count > 0) {
      score += 0.1;
    }

    // Has homepage/website
    if (data.homepage) score += 0.05;

    // Large projects tend to have better maintenance
    if (data.stargazers_count > 1000) score += 0.1;
    if (data.stargazers_count > 10000) score += 0.1;

    return Math.min(Math.round(score * 100) / 100, 1);
  }
}
