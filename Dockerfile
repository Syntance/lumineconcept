FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config + lockfile first (layer cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc turbo.json ./
COPY apps/backend/package.json apps/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile --filter @lumine/backend...

# Copy backend source
COPY apps/backend/ apps/backend/

# Build medusa (server + admin dashboard)
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN cd apps/backend && pnpm medusa build

# Runtime
ENV NODE_ENV=production
WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["sh", "-c", "pnpm medusa db:migrate && pnpm medusa start -H 0.0.0.0"]
