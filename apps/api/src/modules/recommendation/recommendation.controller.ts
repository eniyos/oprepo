import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommend')
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  @Post()
  async recommend(@Body() body: {
    developerId?: string;
    githubUsername?: string;
    context?: {
      timeAvailableHoursPerWeek?: number;
      focus?: 'repos' | 'issues';
      maxResults?: number;
    };
  }) {
    return this.service.recommend(body);
  }

  @Post('feedback')
  async submitFeedback(@Body() body: {
    recommendationId: string;
    rating?: number;
    clickedThrough?: boolean;
    openedPr?: boolean;
    comments?: string;
  }) {
    return this.service.recordFeedback(body);
  }

  @Get('history/:developerId')
  async getHistory(
    @Param('developerId') developerId: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getRecommendationHistory(developerId, limit || 20);
  }
}
