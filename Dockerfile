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
    pnpm medusa build 2>&1 && \
    echo "=== Checking admin build output ===" && \
    if [ -d "dist/public/admin" ]; then \
      echo "Admin found at dist/public/admin — copying to public/admin" && \
      mkdir -p public/admin && \
      cp -r dist/public/admin/* public/admin/ ; \
    elif [ -d ".medusa/server/public/admin" ]; then \
      echo "Admin found at .medusa/server/public/admin — copying to public/admin" && \
      mkdir -p public/admin && \
      cp -r .medusa/server/public/admin/* public/admin/ ; \
    else \
      echo "WARN: No admin build output found" && \
      find . -name "index.html" -not -path "*/node_modules/*" 2>/dev/null ; \
    fi && \
    echo "=== Verifying public/admin ===" && \
    ls -la public/admin/index.html

ENV NODE_ENV=production
WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["sh", "-c", "echo '=== RUNTIME: admin check ===' && ls -la public/admin/index.html 2>/dev/null && echo 'Admin OK' || echo 'NO admin index.html' && pnpm medusa db:migrate && pnpm medusa start -H 0.0.0.0"]
