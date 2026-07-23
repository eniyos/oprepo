import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from '../../database/entities/repository.entity';
import { Recommendation } from '../../database/entities/recommendation.entity';
import { CronService } from './cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Repository, Recommendation])],
  providers: [CronService],
})
export class CronModule {}
