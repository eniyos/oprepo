import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';
import { GithubModule } from './modules/github/github.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { MlModule } from './modules/ml/ml.module';
import { ApiConfig } from './config/api.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ApiConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // use migrations in production
        extra: {
          poolSize: 20,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    GithubModule,
    RecommendationModule,
    MlModule,
  ],
})
export class AppModule {}
