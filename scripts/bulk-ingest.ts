#!/usr/bin/env node
/**
 * Smart popular, underrated, and trending repos.
 *
 * Usage:
 *   npx ts-node scripts/bulk-ingest.ts [--limit 50] [--search-topics "ai,rust,cli"]
 *
 * The seed list includes both mega-stars and hidden gems across every domain.
 * Use --search-topics to also fetch trending repos from GitHub Search API
 * for specific interest areas (requires GITHUB_TOKEN in .env).
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// ─── Curated repo list: popular + underrated gems ───
const CURATED_REPOS = [
  // ── Frontend (popular + underrated) ──
  'facebook/react', 'vuejs/core', 'sveltejs/svelte', 'solidjs/solid',
  'preactjs/preact', 'lit/lit', 'alpinejs/alpine',
  'vercel/next.js', 'nuxt/nuxt', 'remix-run/remix', 'sveltejs/kit',

  // ── CSS / Design (underrated gems) ──
  'tailwindlabs/tailwindcss', 'picocss/pico', 'missing-semester-cn/vue-pure-admin',
  'daisyui/daisyui', 'primefaces/primereact', 'saadeghi/daisyui',

  // ── Backend / API ──
  'expressjs/express', 'nestjs/nest', 'fastify/fastify', 'honojs/hono',
  'elysiajs/elysia', 'trpc/trpc', 'directus/directus',
  'gin-gonic/gin', 'gofiber/fiber', 'echo/echo', 'gohugoio/hugo',

  // ── Languages / runtimes ──
  'nodejs/node', 'denoland/deno', 'oven-sh/bun', 'rust-lang/rust',
  'golang/go', 'python/cpython', 'microsoft/TypeScript', 'ziglang/zig',
  'mojo-lang/mojo', 'tokio-rs/tokio', 'rayon-rs/rayon',

  // ── ML / AI ──
  'langchain-ai/langchain', 'langgenius/dify', 'microsoft/autogen',
  'n8n-io/n8n', 'openai/openai-cookbook', 'ollama/ollama',
  'comfyanonymous/ComfyUI', 'deepseek-ai/deepseek-coder',
  'huggingface/transformers', 'ggerganov/llama.cpp', 'astral-sh/uv',

  // ── Databases ──
  'neondatabase/neon', 'timescale/timescaledb', 'redis/redis',
  'sqlite/sqlite', 'drizzle-team/drizzle-orm', 'prisma/prisma',
  'surrealDB/surrealdb', 'cockroachdb/cockroach', 'pingcap/tidb',

  // ── Dev tools (hidden gems) ──
  'microsoft/vscode', 'neovim/neovim', 'zed-industries/zed',
  'shadcn-ui/ui', 'biomejs/biome', 'ast-grep/ast-grep',
  'BurntSushi/ripgrep', 'sharkdp/bat', 'eza-community/eza',
  'jesseduffield/lazygit', 'Wilfred/difftastic', 'dandavison/delta',

  // ── Infrastructure ──
  'docker/compose', 'kubernetes/kubernetes', 'k3s-io/k3s',
  'hashicorp/terraform', 'prometheus/prometheus', 'grafana/grafana',
  'dagger/dagger', 'pulumi/pulumi', 'earthly/earthly',
  'cloudflare/workers-sdk', 'fly-examples/hello-world',

  // ── Testing ──
  'microsoft/playwright', 'cypress-io/cypress', 'vitest-dev/vitest',
  'testing-library/react-testing-library', 'faker-js/faker',
  'mswjs/msw', 'aspect-build/rules_js',

  // ── Security (often overlooked) ──
  'OWASP/CheatSheetSeries', 'cure53/DOMPurify', 'zaproxy/zaproxy',
  'aquasecurity/trivy', 'snyk/cli',

  // ── Fun / CLI ──
  'curl/curl', 'git/git', 'tmux/tmux', 'yt-dlp/yt-dlp',
  'asciinema/asciinema', 'warpdotdev/warp', 'tldr-pages/tldr',
];

// ─── GitHub Search-based discovery ───
const INTEREST_TOPICS: Record<string, string[]> = {
  frontend: ['react', 'vue', 'svelte', 'solid', 'css-framework'],
  backend: ['rest-api', 'graphql', 'microservices', 'server'],
  ml: ['machine-learning', 'deep-learning', 'llm', 'ai-agents'],
  devtools: ['cli', 'developer-tools', 'productivity'],
  data: ['database', 'data-visualization', 'analytics'],
  mobile: ['react-native', 'flutter', 'swiftui'],
  security: ['security', 'authentication', 'cryptography'],
  infrastructure: ['devops', 'kubernetes', 'docker'],
};

async function searchGitHubTopics(topics: string[], limitPerTopic = 5): Promise<string[]> {
  const results: string[] = [];
  const token = GITHUB_TOKEN;

  if (!token) {
    console.warn('  ⚠️  No GITHUB_TOKEN — skipping GitHub Search API (needs auth for search)\n');
    return [];
  }

  for (const topic of topics) {
    const topicRepos = (INTEREST_TOPICS[topic] || [topic]).slice(0, 3);
    for (const t of topicRepos) {
      try {
        const url = `https://api.github.com/search/repositories?q=topic:${t}+stars:>50&sort=stars&order=desc&per_page=${limitPerTopic}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
        });
        if (!res.ok) continue;
        const data = await res.json();
        for (const item of (data.items || [])) {
          const fullName = item.full_name;
          // Prefer repos with recent activity and under 10k stars (underrated)
          if (!results.includes(fullName) && (item.stargazers_count < 10000 || results.length < 5)) {
            results.push(fullName);
          }
        }
      } catch {}
    }
  }

  return results;
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 75;
  const searchTopicsArg = process.argv.find((a) => a.startsWith('--search-topics='));
  const searchTopics = searchTopicsArg ? searchTopicsArg.split('=')[1].split(',') : [];

  // Start with curated list
  let repos = [...CURATED_REPOS];

  // Add GitHub Search results for specific topics
  if (searchTopics.length > 0) {
    console.log(`🔍 Searching GitHub for trending repos in: ${searchTopics.join(', ')}\n`);
    const discovered = await searchGitHubTopics(searchTopics, 8);
    const newRepos = discovered.filter((r) => !repos.includes(r));
    console.log(`  Found ${newRepos.length} trending repos matching interests\n`);
    repos = [...repos, ...newRepos];
  }

  repos = repos.slice(0, limit);

  console.log(`🍽️  Queuing ${repos.length} repos for ingestion\n`);

  // Send bulk job
  const res = await fetch(`${API_URL}/api/v1/github/ingest/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repos }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Failed: ${res.status} ${text}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log(`✅ Queued ${result.count} repos\n`);
  console.log('Worker processing in background (3 concurrent, 30 req/min rate limit).');
  console.log('Check progress:');
  console.log('  psql -d oprepo -c "SELECT count(*) FROM repositories;"');
  console.log('  tail -f /tmp/api-service.log | grep "ingested"');
}

main().catch(console.error);
