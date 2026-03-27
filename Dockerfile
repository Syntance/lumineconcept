FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc turbo.json ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile --filter @lumine/backend...

COPY apps/backend/ apps/backend/

ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN cd apps/backend && \
    DATABASE_URL=postgres://placeholder:placeholder@localhost/placeholder \
    pnpm medusa build && \
    echo "=== Admin build check ===" && \
    ls -la .medusa/server/public/admin/ 2>/dev/null || \
    echo "WARNING: admin build directory not found" && \
    find .medusa -name "index.html" 2>/dev/null || \
    echo "WARNING: no index.html found in .medusa"

ENV NODE_ENV=production
WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["sh", "-c", "pnpm medusa db:migrate && pnpm medusa start -H 0.0.0.0"]
