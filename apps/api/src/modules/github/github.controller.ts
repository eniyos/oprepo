import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { GithubService } from './github.service';
import { IngestionQueueService } from '../ingestion/ingestion-queue.service';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly queue: IngestionQueueService,
  ) {}

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
}
