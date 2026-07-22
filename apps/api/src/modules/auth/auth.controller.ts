import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private config: ConfigService) {}

  @Get('status')
  async status() {
    return {
      configured: !!this.config.get<string>('GITHUB_CLIENT_ID'),
      provider: 'github',
    };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Passport handles the redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any) {
    return {
      success: true,
      developer: {
        id: req.user.id,
        githubUsername: req.user.githubUsername,
        avatarUrl: req.user.avatarUrl,
      },
    };
  }
}
