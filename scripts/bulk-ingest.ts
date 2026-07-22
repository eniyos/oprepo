#!/usr/bin/env node
/**
 * Bulk ingest script — populates the repo index with top GitHub repos.
 *
 * Usage:
 *   export GITHUB_TOKEN=ghp_...
 *   npx ts-node scripts/bulk-ingest.ts [--limit 50] [--min-stars 1000]
 */

const TOP_REPOS = [
  // Frontend frameworks
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

  // Fun / wildcard
  'curl/curl', 'git/git', 'tmux/tmux', 'yt-dlp/yt-dlp',
];

async function main() {
  const limit = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '50', 10);
  const repos = TOP_REPOS.slice(0, limit);

  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn('⚠️  No GITHUB_TOKEN set. GitHub allows only 60 req/hr unauthenticated.');
    console.warn('   Set GITHUB_TOKEN for higher limits: export GITHUB_TOKEN=ghp_...');
    console.warn('');
  }

  console.log(`🍽️  Bulk-ingesting ${repos.length} repos into ${apiUrl}...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    const progress = `[${i + 1}/${repos.length}]`;

    // Rate limit: sleep 1s between requests for unauthenticated, 200ms for authed
    if (i > 0) {
      await new Promise(r => setTimeout(r, token ? 200 : 1000));
    }

    process.stdout.write(`${progress} ${repo}... `);

    try {
      const res = await fetch(`${apiUrl}/api/v1/github/ingest/repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repo }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log(`❌ ${res.status} ${text.slice(0, 60)}`);
        failed++;
        continue;
      }

      await res.json();
      console.log(`✅`);

      // Also ingest issues (best-effort)
      try {
        await fetch(`${apiUrl}/api/v1/github/ingest/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoFullName: repo }),
        });
      } catch {}

      success++;
    } catch (err: any) {
      console.log(`❌ ${err.message.slice(0, 60)}`);
      failed++;
    }
  }

  console.log(`\n📊 Done: ${success} succeeded, ${failed} failed`);
}

main().catch(console.error);
