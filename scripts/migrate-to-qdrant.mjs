/**
 * Quick migration: read repositories with embeddings from Postgres,
 * upsert into Qdrant. Run: node scripts/migrate-to-qdrant.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pg = require('pg');
const { QdrantClient } = require('@qdrant/js-client-rest');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://oprepo:oprepo@localhost:5432/oprepo';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = process.env.QDRANT_COLLECTION || 'repositories';

async function migrate() {
  console.log(`Connecting to Postgres...`);
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  
  console.log(`Connecting to Qdrant at ${QDRANT_URL}...`);
  const qdrant = new QdrantClient({ url: QDRANT_URL });

  // Ensure collection
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION);
  if (!exists) {
    console.log('Creating collection...');
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: 384, distance: 'Cosine' },
    });
  }

  // Fetch repos with embeddings from Postgres
  const { rows } = await pool.query(`
    SELECT id, full_name, description, topics, domain_tags,
           primary_language, secondary_languages,
           stargazers_count, forks_count, open_issues_count,
           community_health_score, has_contributing_guide,
           has_code_of_conduct, license, homepage, embeddings
    FROM repositories
    WHERE embeddings IS NOT NULL
  `);

  console.log(`Found ${rows.length} repos with embeddings.`);

  let migrated = 0;
  for (const row of rows) {
    let embedding;
    try {
      // pgvector returns embeddings as a string like '[0.1,0.2,...]'
      embedding = typeof row.embeddings === 'string'
        ? JSON.parse(row.embeddings)
        : row.embeddings;
    } catch {
      console.warn(`  Skipping ${row.full_name}: couldn't parse embeddings`);
      continue;
    }

    if (!embedding || embedding.length !== 384) {
      console.warn(`  Skipping ${row.full_name}: embedding length ${embedding?.length}`);
      continue;
    }

    const stars = row.stargazers_count || 0;
    const tier = stars > 5000 ? 'popular' : stars > 500 ? 'mid' : 'niche';

    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: [{
        id: row.id,
        vector: embedding,
        payload: {
          fullName: row.full_name,
          description: row.description,
          topics: row.topics || [],
          domainTags: row.domain_tags || [],
          primaryLanguage: row.primary_language,
          secondaryLanguages: row.secondary_languages || [],
          stargazersCount: stars,
          forksCount: row.forks_count || 0,
          openIssuesCount: row.open_issues_count || 0,
          communityHealthScore: row.community_health_score || 0,
          hasContributingGuide: row.has_contributing_guide || false,
          hasCodeOfConduct: row.has_code_of_conduct || false,
          license: row.license,
          homepage: row.homepage,
          tier,
          trendingScore: 0,
          lastStarSnapshot: stars,
        },
      }],
    });
    migrated++;
    if (migrated % 10 === 0) {
      console.log(`  ${migrated}/${rows.length} migrated...`);
    }
  }

  console.log(`\n✅ Done. Migrated ${migrated} repos to Qdrant.`);
  await pool.end();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
