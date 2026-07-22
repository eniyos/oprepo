import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Developer } from '../../database/entities/developer.entity';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { Recommendation } from '../../database/entities/recommendation.entity';
import { Feedback } from '../../database/entities/feedback.entity';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { MatchingEngine } from './matching-engine.service';
import { MlModule } from '../ml/ml.module';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Developer, Repository, Issue, Recommendation, Feedback]),
    MlModule,
    GithubModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService, MatchingEngine],
  exports: [RecommendationService],
})
export class RecommendationModule {}
