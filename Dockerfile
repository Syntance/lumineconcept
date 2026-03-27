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
    echo "Build complete — checking admin output" && \
    if [ -d "dist/public/admin" ]; then \
      mkdir -p public/admin && \
      cp -r dist/public/admin/* public/admin/ && \
      echo "Admin copied OK: $(ls public/admin/index.html)" ; \
    else \
      echo "ERROR: No admin build at dist/public/admin" && \
      find . -name "index.html" -not -path "*/node_modules/*" 2>/dev/null && \
      exit 1 ; \
    fi

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
WORKDIR /app/apps/backend
EXPOSE 8080

CMD ["sh", "-c", "pnpm medusa db:migrate && exec pnpm medusa start -H 0.0.0.0 -p 8080"]
