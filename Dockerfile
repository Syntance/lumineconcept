FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc turbo.json ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile --filter @lumine/backend...

COPY apps/backend/ apps/backend/

RUN cd apps/backend && \
    NODE_OPTIONS="--max-old-space-size=2048" \
    DATABASE_URL=postgres://placeholder:placeholder@localhost/placeholder \
    pnpm medusa build 2>&1 && \
    if [ -d "dist/public/admin" ]; then \
      mkdir -p public/admin && \
      cp -r dist/public/admin/* public/admin/ ; \
    fi && \
    ls public/admin/index.html

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["sh", "-c", "pnpm medusa db:migrate && pnpm medusa start -H 0.0.0.0"]
