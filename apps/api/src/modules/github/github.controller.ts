import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubIngestionService } from './github-ingestion.service';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly ingestionService: GithubIngestionService,
  ) {}

  @Get('profile/:username')
  async getProfile(@Param('username') username: string) {
    return this.githubService.fetchDeveloperProfile(username);
  }

  @Post('ingest/repo')
  async ingestRepo(@Body() body: { repoFullName: string }) {
    return this.ingestionService.ingestRepository(body.repoFullName);
  }

  @Post('ingest/issues')
  async ingestIssues(@Body() body: { repoFullName: string; labels?: string[] }) {
    return this.ingestionService.ingestIssues(body.repoFullName, body.labels);
  }

  @Get('developers/:id')
  async getDeveloper(@Param('id', ParseUUIDPipe) id: string) {
    return this.githubService.getDeveloper(id);
  }
}
