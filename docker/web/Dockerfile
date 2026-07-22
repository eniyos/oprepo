# ─── Stage 1: Install dependencies ───────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ─────────────────────────────────────────
FROM deps AS build
COPY apps/web apps/web/
RUN pnpm --filter @oprepo/web run build

# ─── Stage 3: Production runner ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/.next /app/apps/web/.next
COPY --from=build /app/apps/web/public /app/apps/web/public
COPY --from=build /app/apps/web/package.json /app/apps/web/
COPY --from=build /app/packages /app/packages
EXPOSE 3000
CMD ["pnpm", "--filter", "@oprepo/web", "start"]
