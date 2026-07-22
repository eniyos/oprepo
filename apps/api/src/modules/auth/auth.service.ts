import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Developer } from '../../database/entities/developer.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Developer)
    private developerRepo: Repository<Developer>,
    private config: ConfigService,
  ) {}

  /**
   * Handle GitHub OAuth callback — create or update developer profile.
   */
  async handleOAuthLogin(githubProfile: any) {
    const profile = githubProfile._json;
    const languages = await this.extractLanguages(githubProfile.username);

    const existing = await this.developerRepo.findOneBy({
      githubUsername: githubProfile.username,
    });

    const skills = {
      languages,
      frameworks: [] as string[],
      domains: this.inferDomains(profile),
      contributionStyle: [] as string[],
      experienceLevel: this.inferExperienceLevel(profile),
    };

    if (existing) {
      existing.bio = profile.bio;
      existing.location = profile.location;
      existing.avatarUrl = profile.avatar_url;
      existing.skills = skills as any;
      existing.interests = profile.blog ? [profile.blog] : [];
      return this.developerRepo.save(existing);
    }

    return this.developerRepo.save(
      this.developerRepo.create({
        githubUsername: githubProfile.username,
        bio: profile.bio,
        location: profile.location,
        avatarUrl: profile.avatar_url,
        skills: skills as any,
        interests: [],
      }),
    );
  }

  private async extractLanguages(username: string): Promise<string[]> {
    // Inlined lightweight version — full analysis uses the repo scanner
    return []; // populated on first recommend call via GithubService
  }

  private inferDomains(profile: any): string[] {
    const domains: string[] = [];
    const bio = (profile.bio || '').toLowerCase();
    if (bio.includes('frontend') || bio.includes('react') || bio.includes('ui')) domains.push('frontend');
    if (bio.includes('backend') || bio.includes('api') || bio.includes('server')) domains.push('backend');
    if (bio.includes('ml') || bio.includes('ai') || bio.includes('data')) domains.push('ml');
    if (bio.includes('fullstack') || bio.includes('full stack')) { domains.push('frontend'); domains.push('backend'); }
    return domains;
  }

  private inferExperienceLevel(profile: any): string {
    if (!profile.public_repos) return 'beginner';
    if (profile.public_repos > 50) return 'advanced';
    if (profile.public_repos > 15) return 'intermediate';
    return 'beginner';
  }
}
