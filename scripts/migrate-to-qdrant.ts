/**
 * Migration script: read existing vector embeddings from Postgres (pgvector)
 * and upsert them into Qdrant. Safe to run multiple times (idempotent).
 *
 * Usage: npx ts-node scripts/migrate-to-qdrant.ts
 *
 * After confirming migration succeeded, drop the pgvector extension and
 * the `embeddings` column from the `repositories` table:
 *   ALTER TABLE repositories DROP COLUMN embeddings;
 *   DROP EXTENSION vector;
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Repository } from '../apps/api/src/database/entities/repository.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../apps/api/.env' });

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = process.env.QDRANT_COLLECTION || 'repositories';
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://oprepo:oprepo@localhost:5432/oprepo';

async function migrate() {
  console.log('Connecting to Postgres...');
  const pgSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    entities: [Repository],
    synchronize: false,
  });
  await pgSource.initialize();
  const repoRepo = pgSource.getRepository(Repository);

  console.log('Connecting to Qdrant...');
  const qdrant = new QdrantClient({ url: QDRANT_URL });

  // Ensure collection exists
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION);
  if (!exists) {
    console.log('Creating collection...');
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: 384, distance: 'Cosine' },
    });
    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: 'tier',
      field_schema: 'keyword',
    });
    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: 'domainTags',
      field_schema: 'keyword',
    });
    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: 'communityHealthScore',
      field_schema: 'float',
    });
  }

  // Fetch all repos with embeddings
  const repos = await repoRepo.find({
    where: { embeddings: { type: 'vector', operator: 'IS NOT NULL' } as any },
  });

  console.log(`Found ${repos.length} repos with embeddings.`);

  let migrated = 0;
  let skipped = 0;

  for (const repo of repos) {
    if (!repo.embeddings || repo.embeddings.length !== 384) {
      skipped++;
      continue;
    }

    // Determine tier based on stars
    const tier =
      repo.stargazersCount > 5000
        ? 'popular'
        : repo.stargazersCount > 500
          ? 'mid'
          : 'niche';

    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: repo.id,
          vector: repo.embeddings,
          payload: {
            fullName: repo.fullName,
            description: repo.description,
            topics: repo.topics,
            domainTags: repo.domainTags,
            primaryLanguage: repo.primaryLanguage,
            secondaryLanguages: repo.secondaryLanguages,
            stargazersCount: repo.stargazersCount,
            forksCount: repo.forksCount,
            openIssuesCount: repo.openIssuesCount,
            communityHealthScore: repo.communityHealthScore,
            hasContributingGuide: repo.hasContributingGuide,
            hasCodeOfConduct: repo.hasCodeOfConduct,
            license: repo.license,
            homepage: repo.homepage,
            tier,
            trendingScore: 0,
            lastStarSnapshot: repo.stargazersCount,
          },
        },
      ],
    });
    migrated++;
    if (migrated % 10 === 0) {
      console.log(`  Migrated ${migrated}/${repos.length}...`);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
  await pgSource.destroy();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
