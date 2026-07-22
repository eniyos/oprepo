import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/embed`, { texts: [text] }),
      );
      return data.embeddings[0];
    } catch (error) {
      this.logger.error('ML service embedding failed', error);
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
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

  async computeSimilarity(devEmbedding: number[], repoEmbeddings: number[][]): Promise<number[]> {
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
