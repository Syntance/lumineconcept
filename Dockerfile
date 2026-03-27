FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ── install dependencies ──────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc turbo.json ./
COPY apps/backend/package.json apps/backend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── build (admin dashboard + server) ─────────────────────────
FROM base AS build
COPY --from=deps /app/ ./
COPY apps/backend/ apps/backend/
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048"
RUN cd apps/backend && pnpm medusa build

# ── production image ──────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps  /app/node_modules        ./node_modules
COPY --from=deps  /app/package.json         ./package.json
COPY --from=deps  /app/pnpm-workspace.yaml  ./pnpm-workspace.yaml
COPY --from=deps  /app/pnpm-lock.yaml       ./pnpm-lock.yaml
COPY --from=deps  /app/.npmrc               ./.npmrc
COPY --from=build /app/apps/backend         ./apps/backend

WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["sh", "-c", "pnpm medusa db:migrate && pnpm medusa start -H 0.0.0.0"]
