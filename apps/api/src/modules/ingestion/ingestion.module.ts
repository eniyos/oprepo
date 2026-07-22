import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from '../../database/entities/repository.entity';
import { Issue } from '../../database/entities/issue.entity';
import { IngestionQueueService } from './ingestion-queue.service';
import { IngestionWorker } from './ingestion-worker.service';
import { MlModule } from '../ml/ml.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'ingestion',
    }),
    TypeOrmModule.forFeature([Repository, Issue]),
    MlModule,
  ],
  providers: [IngestionQueueService, IngestionWorker],
  exports: [IngestionQueueService],
})
export class IngestionModule {}
