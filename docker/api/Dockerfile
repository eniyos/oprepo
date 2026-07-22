# ─── Stage 1: Install dependencies ───────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ─────────────────────────────────────────
FROM deps AS build
COPY apps/api apps/api/
RUN pnpm --filter @oprepo/api run build

# ─── Stage 3: Production runner ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages /app/packages
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
