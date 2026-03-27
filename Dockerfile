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
    echo "=== Build done, checking admin ===" && \
    if [ -d "dist/public/admin" ]; then \
      echo "Admin found at dist/public/admin — copying" && \
      mkdir -p public/admin && \
      cp -r dist/public/admin/* public/admin/ ; \
    else \
      echo "WARN: No admin build output (DISABLE_ADMIN may be set)" ; \
    fi

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
WORKDIR /app/apps/backend
EXPOSE 8080

CMD ["sh", "-c", "\
  echo '########## LUMINE BOOT ##########' && \
  echo \"PORT env=$PORT | Will listen on 8080\" && \
  echo \"DB=$([ -n \"$DATABASE_URL\" ] && echo OK || echo MISSING!)\" && \
  echo \"REDIS=$([ -n \"$REDIS_URL\" ] && echo OK || echo not-set)\" && \
  echo \"HEAP=$NODE_OPTIONS\" && \
  echo \"MEM=$(awk '/MemTotal/{print $2/1024\"MB\"}' /proc/meminfo)\" && \
  echo '#################################' && \
  pnpm medusa db:migrate 2>&1 && \
  echo '>>> Migrations done, starting server...' && \
  exec pnpm medusa start -H 0.0.0.0 -p 8080 \
"]
