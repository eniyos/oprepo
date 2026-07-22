import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Developer } from '../../database/entities/developer.entity';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubIngestionService } from './github-ingestion.service';
import { MlModule } from '../ml/ml.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Developer, Repository, Issue]),
    MlModule,
  ],
  controllers: [GithubController],
  providers: [GithubService, GithubIngestionService],
  exports: [GithubService],
})
export class GithubModule {}
