import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

@Injectable()
export class GithubOAuthStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubOAuthStrategy.name);

  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET');

    // If no GitHub OAuth credentials, log a warning and use dummy values
    // The auth endpoint will return a helpful message instead of crashing
    if (!clientID || !clientSecret) {
      Logger.warn(
        'GitHub OAuth not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env',
        GithubOAuthStrategy.name,
      );
    }

    super({
      clientID: clientID || 'unconfigured',
      clientSecret: clientSecret || 'unconfigured',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:4000/api/v1/auth/github/callback',
      scope: ['read:user', 'user:email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    if (!profile) throw new UnauthorizedException('GitHub authentication failed');
    return this.authService.handleOAuthLogin(profile);
  }
}
