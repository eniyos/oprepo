import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  public client: QdrantClient;
  private collectionName: string;

  constructor(private config: ConfigService) {
    const url = this.config.get('api.qdrant.url')!;
    this.collectionName = this.config.get('api.qdrant.collectionName')!;
    this.client = new QdrantClient({ url });
  }

  async onModuleInit() {
    try {
      await this.ensureCollection();
    } catch (e) {
      this.logger.warn('Qdrant not available at init, will retry on first use', e);
    }
  }

  async ensureCollection() {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === this.collectionName,
    );
    if (!exists) {
      this.logger.log(`Creating Qdrant collection: ${this.collectionName}`);
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 384,
          distance: 'Cosine',
        },
      });
      // Create payload indexes for filtering
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'tier',
        field_schema: 'keyword',
      });
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'domainTags',
        field_schema: 'keyword',
      });
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'communityHealthScore',
        field_schema: 'float',
      });
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: 'stargazersCount',
        field_schema: 'integer',
      });
      this.logger.log(`Collection ${this.collectionName} created`);
    }
  }

  async upsertPoint(
    id: string,
    vector: number[],
    payload: Record<string, any>,
  ) {
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [{ id, vector, payload }],
    });
  }

  async search(
    vector: number[],
    filter?: Record<string, any>,
    limit = 50,
  ): Promise<{ id: string; score: number; payload: Record<string, any> }[]> {
    const result = await this.client.search(this.collectionName, {
      vector,
      limit,
      filter,
      with_payload: true,
    });
    return result.map((r) => ({
      id: r.id as string,
      score: r.score ?? 0,
      payload: r.payload as Record<string, any>,
    }));
  }

  async searchByTier(
    vector: number[],
    tier: 'popular' | 'mid' | 'niche',
    additionalFilter?: Record<string, any>,
    limit = 20,
  ): Promise<{ id: string; score: number; payload: Record<string, any> }[]> {
    const must: any[] = [{ key: 'tier', match: { value: tier } }];
    if (additionalFilter?.must) {
      must.push(...additionalFilter.must);
    }
    const result = await this.client.search(this.collectionName, {
      vector,
      limit,
      filter: { must },
      with_payload: true,
    });
    return result.map((r) => ({
      id: r.id as string,
      score: r.score ?? 0,
      payload: r.payload as Record<string, any>,
    }));
  }

  async deletePoint(id: string) {
    await this.client.delete(this.collectionName, {
      wait: true,
      points: [id],
    });
  }

  async scrollAll(
    limit = 100,
    offset?: string,
  ): Promise<{
    points: { id: string; payload: Record<string, any> }[];
    nextOffset?: string;
  }> {
    const result = await this.client.scroll(this.collectionName, {
      limit,
      offset,
      with_payload: true,
      with_vector: false,
    });
    return {
      points: result.points.map((p) => ({
        id: p.id as string,
        payload: p.payload as Record<string, any>,
      })),
      nextOffset: result.next_page_offset as string | undefined,
    };
  }

  async count(): Promise<number> {
    const result = await this.client.count(this.collectionName);
    return result.count ?? 0;
  }
}
