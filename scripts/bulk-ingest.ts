#!/usr/bin/env node
/**
 * Bulk ingest script — populates the repo index via the async ingestion queue.
 *
 * Usage:
 *   export GITHUB_TOKEN=ghp_...        # optional but recommended
 *   npx ts-node scripts/bulk-ingest.ts [--limit 50]
 *
 * All repos are sent to the queue in one batch. The API processes them
 * in the background with rate-limit-aware concurrency (max 3 at a time,
 * max 30 requests per 60 seconds). Check the API logs for progress.
 */

const TOP_REPOS = [
  // Frontend
  'facebook/react', 'vuejs/core', 'sveltejs/svelte', 'angular/angular',
  'vercel/next.js', 'nuxt/nuxt', 'remix-run/remix',

  // Backend / API
  'expressjs/express', 'nestjs/nest', 'fastify/fastify', 'vercel/ai',
  'gin-gonic/gin', 'gohugoio/hugo',

  // Languages / runtimes
  'nodejs/node', 'denoland/deno', 'rust-lang/rust', 'golang/go',
  'python/cpython', 'microsoft/TypeScript', 'oven-sh/bun',

  // ML / AI
  'langchain-ai/langchain', 'microsoft/autogen', 'deepseek-ai/deepseek',
  'openai/openai-cookbook', 'ollama/ollama', 'comfyanonymous/ComfyUI',

  // Databases
  'neondatabase/neon', 'timescale/timescaledb', 'redis/redis',
  'dgraph-io/badger', 'etcd-io/etcd',

  // Dev tools
  'microsoft/vscode', 'neovim/neovim', 'zed-industries/zed',
  'shadcn-ui/ui', 'tailwindlabs/tailwindcss', 'prisma/prisma',
  'biomejs/biome', 'prettier/prettier', 'eslint/eslint',

  // Infrastructure
  'docker/compose', 'kubernetes/kubernetes', 'n8n-io/n8n',
  'hashicorp/terraform', 'prometheus/prometheus', 'grafana/grafana',

  // Blockchain / Web3
  'solana-labs/solana', 'ethereum/solidity', 'hyperledger/fabric',

  // UI libraries
  'radix-ui/primitives', 'mui/material-ui', 'chakra-ui/chakra-ui',
  'tanstack/query', 'pmndrs/zustand', 'storybookjs/storybook',

  // Testing
  'microsoft/playwright', 'cypress-io/cypress', 'vitest-dev/vitest',
  'jestjs/jest',

  // Fun
  'curl/curl', 'git/git', 'tmux/tmux', 'yt-dlp/yt-dlp',
];

async function main() {
  const limit = parseInt(
    process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '50',
    10,
  );
  const repos = TOP_REPOS.slice(0, limit);
  const apiUrl = process.env.API_URL || 'http://localhost:4000';

  console.log(`🍽️  Queuing ${repos.length} repos for ingestion via ${apiUrl}...\n`);

  // Send all repos as a single bulk job
  const res = await fetch(`${apiUrl}/api/v1/github/ingest/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repos }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Failed to queue bulk job: ${res.status} ${text}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log(`✅ Queued ${result.count} repos (bulk job submitted)\n`);
  console.log('The worker processes them in the background with rate-limit awareness.');
  console.log('Monitor progress via:');
  console.log('  tail -f /tmp/api-service.log');
}

main().catch(console.error);
