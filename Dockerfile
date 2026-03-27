FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc turbo.json ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile --filter @lumine/backend...

COPY apps/backend/ apps/backend/

RUN cd apps/backend && \
    NODE_OPTIONS="--max-old-space-size=2048" \
    NODE_ENV=production \
    MEDUSA_BACKEND_URL=https://medusa-backend-lumineconceptpl.up.railway.app \
    DATABASE_URL=postgres://placeholder:placeholder@localhost/placeholder \
    pnpm medusa build 2>&1 && \
    echo "=== Build done ===" && \
    if [ -d "dist/public/admin" ]; then \
      echo "Admin found — copying" && \
      mkdir -p public/admin && \
      cp -r dist/public/admin/* public/admin/ ; \
    else \
      echo "WARN: No admin build output" ; \
    fi

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
WORKDIR /app/apps/backend
EXPOSE 8080

CMD ["sh", "-c", "pnpm medusa db:migrate && exec pnpm medusa start -H 0.0.0.0 -p 8080"]
