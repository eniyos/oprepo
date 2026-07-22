import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from '../../database/entities/repository.entity';
import { CronService } from './cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Repository])],
  providers: [CronService],
})
export class CronModule {}
