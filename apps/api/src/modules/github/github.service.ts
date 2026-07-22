import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    const apiBase = this.config.get('api.github.apiBase')!;
    const token = this.config.get('api.github.token')!;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    this.client = axios.create({
      baseURL: apiBase,
      headers,
    });
  }

  async fetchDeveloperProfile(username: string) {
    try {
      const { data } = await this.client.get(`/users/${username}`);
      const repos = await this.fetchUserRepos(username);

      const languages = this.extractLanguages(repos);
      const topics = this.extractTopics(repos);
      const domains = this.inferDomains(repos);

      return {
        githubUsername: data.login,
        bio: data.bio,
        location: data.location,
        avatarUrl: data.avatar_url,
        skills: { languages, frameworks: [], domains, contributionStyle: [], experienceLevel: this.inferExperienceLevel(data) },
        interests: topics,
        goals: [],
        constraints: [],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch profile for ${username}`, error);
      throw error;
    }
  }

  private async fetchUserRepos(username: string, page = 1, perPage = 50): Promise<any[]> {
    const { data } = await this.client.get(`/users/${username}/repos`, {
      params: { page, per_page: perPage, sort: 'updated', direction: 'desc' },
    });
    if (data.length === perPage) {
      return data.concat(await this.fetchUserRepos(username, page + 1, perPage));
    }
    return data;
  }

  async getDeveloper(id: string) {
    // Placeholder — will hydrate full profile with embedding
    return { id, message: 'Developer profile loaded' };
  }

  private extractLanguages(repos: any[]): string[] {
    const freq = new Map<string, number>();
    for (const repo of repos) {
      if (repo.language) {
        freq.set(repo.language, (freq.get(repo.language) || 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang]) => lang);
  }

  private extractTopics(repos: any[]): string[] {
    const topicSet = new Set<string>();
    for (const repo of repos) {
      if (repo.topics) {
        repo.topics.forEach((t: string) => topicSet.add(t));
      }
    }
    return [...topicSet].slice(0, 20);
  }

  private inferDomains(repos: any[]): string[] {
    // Simple heuristic: map known topic patterns to domains
    const domainMap: Record<string, string> = {
      machine: 'ML/AI',
      ai: 'ML/AI',
      llm: 'ML/AI',
      data: 'Data',
      frontend: 'Frontend',
      react: 'Frontend',
      api: 'Backend',
      backend: 'Backend',
      cli: 'Developer Tools',
      devtool: 'Developer Tools',
      infra: 'Infrastructure',
      devops: 'Infrastructure',
      security: 'Security',
      blockchain: 'Blockchain',
      mobile: 'Mobile',
      testing: 'Testing/QA',
      docs: 'Documentation',
    };

    const domains = new Set<string>();
    for (const repo of repos) {
      if (repo.topics) {
        for (const topic of repo.topics) {
          for (const [key, domain] of Object.entries(domainMap)) {
            if (topic.toLowerCase().includes(key)) {
              domains.add(domain);
            }
          }
        }
      }
      if (repo.description) {
        const desc = repo.description.toLowerCase();
        if (desc.includes('machine learning') || desc.includes('deep learning')) domains.add('ML/AI');
        if (desc.includes('api') || desc.includes('server')) domains.add('Backend');
        if (desc.includes('react') || desc.includes('ui')) domains.add('Frontend');
      }
    }
    return [...domains];
  }

  private inferExperienceLevel(profile: any): string {
    if (!profile || !profile.public_repos) return 'beginner';
    if (profile.public_repos > 50) return 'advanced';
    if (profile.public_repos > 15) return 'intermediate';
    return 'beginner';
  }
}
