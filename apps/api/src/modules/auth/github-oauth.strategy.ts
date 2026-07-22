import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

@Injectable()
export class GithubOAuthStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:4000/api/v1/auth/github/callback',
      scope: ['read:user', 'user:email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    if (!profile) throw new UnauthorizedException('GitHub authentication failed');
    return this.authService.handleOAuthLogin(profile);
  }
}
