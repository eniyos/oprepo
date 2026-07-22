import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface EmbeddingResult {
  texts: string[];
  embeddings: number[][];
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly baseUrl: string;

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {
    this.baseUrl = this.config.get('api.ml.serviceUrl')!;
  }

  async embedText(text: string): Promise<number[]> {
    const result = await this.embedBatch([text]);
    return result[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/embed`, { texts }),
      );
      return data.embeddings;
    } catch (error) {
      this.logger.error('ML service batch embedding failed', error);
      throw error;
    }
  }

  async computeSimilarities(
    devEmbedding: number[],
    repoEmbeddings: number[][],
  ): Promise<number[]> {
    if (repoEmbeddings.length === 0) return [];
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/similarity`, {
          query: devEmbedding,
          candidates: repoEmbeddings,
        }),
      );
      return data.scores;
    } catch (error) {
      this.logger.error('ML service similarity computation failed', error);
      throw error;
    }
  }

  /**
   * Build a search text from a developer profile for embedding.
   */
  buildDeveloperText(developer: any): string {
    const skills = developer.skills || {};
    const parts: string[] = [];

    const langs = skills.languages as string[] | undefined;
    if (langs?.length) parts.push(`Languages: ${langs.join(', ')}`);

    const frameworks = skills.frameworks as string[] | undefined;
    if (frameworks?.length) parts.push(`Frameworks: ${frameworks.join(', ')}`);

    const domains = skills.domains as string[] | undefined;
    if (domains?.length) parts.push(`Domains: ${domains.join(', ')}`);

    const interests = developer.interests as string[] | undefined;
    if (interests?.length) parts.push(`Interests: ${interests.join(', ')}`);

    return parts.join('\n');
  }

  /**
   * Build a search text from a repository for embedding.
   */
  buildRepoText(repo: any): string {
    const parts: string[] = [];

    if (repo.description) parts.push(repo.description);
    if (repo.topics?.length) parts.push(`Topics: ${repo.topics.join(', ')}`);
    if (repo.primaryLanguage) parts.push(`Language: ${repo.primaryLanguage}`);

    return parts.join('\n');
  }

  async health(): Promise<boolean> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`),
      );
      return data.status === 'ok';
    } catch {
      return false;
    }
  }
}
