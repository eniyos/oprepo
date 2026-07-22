import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { GithubService } from './github.service';
import { IngestionQueueService } from '../ingestion/ingestion-queue.service';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Controller('github')
export class GithubController {
  private readonly client: AxiosInstance;

  constructor(
    private readonly githubService: GithubService,
    private readonly queue: IngestionQueueService,
    private config: ConfigService,
  ) {
    const token = this.config.get('api.github.token');
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    this.client = axios.create({ baseURL: 'https://api.github.com', headers });
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string) {
    return this.githubService.fetchDeveloperProfile(username);
  }

  @Post('ingest/repo')
  async ingestRepo(@Body() body: { repoFullName: string }) {
    return this.queue.queueRepoIngestion(body.repoFullName);
  }

  @Post('ingest/issues')
  async ingestIssues(@Body() body: { repoFullName: string; labels?: string[] }) {
    return this.queue.queueIssuesIngestion(body.repoFullName, body.labels);
  }

  @Post('ingest/bulk')
  async ingestBulk(@Body() body: { repos: string[] }) {
    return this.queue.queueBulkIngestion(body.repos);
  }

  @Get('developers/:id')
  async getDeveloper(@Param('id', ParseUUIDPipe) id: string) {
    return this.githubService.getDeveloper(id);
  }

  /**
   * Discover repos matching a set of interests.
   * Searches GitHub by topic/language, filters for underrated gems
   * (good health but lower stars), and returns them.
   */
  @Get('discover')
  async discover(@Query('topics') topics: string, @Query('limit') limit?: string) {
    const interestAreas = topics.split(',').map((t) => t.trim());
    const maxResults = parseInt(limit || '20', 10);
    const results: any[] = [];

    for (const area of interestAreas.slice(0, 5)) {
      try {
        // Strategy: find repos with recent activity, good-first-issues, 
        // reasonable quality, filtering out the mega-popular ones
        // Sort by recently updated to find active maintained projects
        const query = `topic:${area} good-first-issues:>0 pushed:>2025-04-01`;
        const { data } = await this.client.get('/search/repositories', {
          params: { q: query, sort: 'updated', order: 'desc', per_page: 15 },
        });
        for (const item of data.items || []) {
          const health = this.computeQuickHealth(item);
          if (health < 0.4) continue;
          // Filter out already-popular repos we already have
          if (item.stargazers_count > 20000) continue;
          const exists = results.some((r) => r.fullName === item.full_name);
          if (exists) continue;
          results.push({
            fullName: item.full_name,
            description: item.description?.slice(0, 120),
            stars: item.stargazers_count,
            language: item.language,
            topics: item.topics,
            url: item.html_url,
            openIssues: item.open_issues_count,
            health,
            reason: `Active with open issues for new contributors`,
          });
        }
      } catch { /* skip failed searches */ }
    }

    // If not enough results, do a broader search
    if (results.length < maxResults) {
      for (const area of interestAreas.slice(0, 3)) {
        try {
          const query = `topic:${area} stars:>50 stars:<10000 pushed:>2025-01-01`;
          const { data } = await this.client.get('/search/repositories', {
            params: { q: query, sort: 'updated', order: 'desc', per_page: 10 },
          });
          for (const item of data.items || []) {
            const health = this.computeQuickHealth(item);
            if (health < 0.4) continue;
            const exists = results.some((r) => r.fullName === item.full_name);
            if (exists) continue;
            results.push({
              fullName: item.full_name,
              description: item.description?.slice(0, 120),
              stars: item.stargazers_count,
              language: item.language,
              topics: item.topics,
              url: item.html_url,
              openIssues: item.open_issues_count,
              health,
              reason: `Underrated ${area} project with recent activity`,
            });
          }
        } catch { /* skip */ }
      }
    }

    return results.slice(0, maxResults);
  }

  private computeQuickHealth(item: any): number {
    let s = 0.3;
    if (item.description?.length > 20) s += 0.2;
    if (item.topics?.length > 0) s += 0.15;
    if (item.license) s += 0.1;
    if (item.pushed_at && new Date(item.pushed_at) > new Date(Date.now() - 90 * 86400000)) s += 0.25;
    return Math.min(Math.round(s * 100) / 100, 1);
  }
}
