# OpRepo

**Developer–Repository Matchmaker** — Connect developers with open-source projects they'll love contributing to.

OpRepo analyzes developer skills, interests, and goals, then matches them with repositories and issues that maximize fit, motivation, and impact.

## Architecture

```
oprepo/
├── apps/
│   ├── api/          # NestJS API — recommendation engine, GitHub ingestion
│   └── web/          # Next.js frontend — discover recommendations
├── packages/
│   ├── shared/       # Shared TypeScript types (Developer, Repository, Recommendation)
│   └── config/       # ESLint + TypeScript configs
├── services/
│   └── ml/           # Python ML service — sentence-transformers embeddings
├── docker/           # Dockerfiles for each service
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (`corepack enable && corepack prepare pnpm@9.12 --activate`)
- Docker & Docker Compose
- Python >= 3.11 (for ML service)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, with `repo` and `user` scopes)

### Setup

```bash
# Clone
git clone https://github.com/eniyos/oprepo.git
cd oprepo

# Install JS dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and add your GITHUB_TOKEN

# Start infrastructure (PostgreSQL + pgvector + Redis)
docker compose up -d db redis

# Start ML service (in a separate terminal)
cd services/ml
pip install -r requirements.txt
uvicorn src.app:app --reload --port 8000

# Start API and web
pnpm dev
```

The API runs at `http://localhost:4000` and the web app at `http://localhost:3000`.

### Ingest a Repository

```bash
curl -X POST http://localhost:4000/api/v1/github/ingest/repo \
  -H "Content-Type: application/json" \
  -d '{"repoFullName": "vercel/next.js"}'

# Also ingest issues
curl -X POST http://localhost:4000/api/v1/github/ingest/issues \
  -H "Content-Type: application/json" \
  -d '{"repoFullName": "vercel/next.js"}'
```

### Get Recommendations

```bash
curl -X POST http://localhost:4000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"githubUsername": "octocat", "context": {"focus": "repos", "maxResults": 6}}'
```

## Matching Engine

The recommendation engine scores candidates across 5 dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Skill overlap** | 35% | Language and framework match |
| **Domain affinity** | 25% | Topic and domain tag match |
| **Popularity** | 15% | Stars and community size |
| **Community health** | 10% | Response times, code of conduct, contributing guide |
| **Issue bonus** | +20% | "good first issue" or "help wanted" labels |

Difficulty adjustment: penalizes candidates too far above the developer's level, rewards stretch goals.

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL + pgvector, Redis, Axios
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **ML**: Python, FastAPI, sentence-transformers, NumPy
- **Infra**: Docker Compose, GitHub Actions

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/github/profile/:username` | Fetch developer profile |
| POST | `/api/v1/github/ingest/repo` | Ingest a repository |
| POST | `/api/v1/github/ingest/issues` | Ingest issues for a repo |
| POST | `/api/v1/recommend` | Get personalized recommendations |
| POST | `/api/v1/recommend/feedback` | Submit feedback on a recommendation |
| GET | `/api/v1/recommend/history/:id` | Get recommendation history |

## Development

```bash
pnpm dev          # Start API + web
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm typecheck    # TypeScript check all packages
pnpm test         # Run tests
docker compose up -d  # Start all services
```

## License

MIT
