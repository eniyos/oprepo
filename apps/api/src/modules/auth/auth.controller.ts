import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor() {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Passport redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any) {
    // On success, redirect to frontend with a session token
    // In MVP, we return the developer profile directly
    // Future: issue JWT or session cookie
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
