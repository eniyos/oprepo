import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubOAuthStrategy } from './github-oauth.strategy';
import { Developer } from '../../database/entities/developer.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'github' }),
    TypeOrmModule.forFeature([Developer]),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GithubOAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
