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
    pnpm medusa build 2>&1 | tee /tmp/medusa-build.log ; \
    echo "=== FULL .medusa tree ===" && \
    find .medusa -type f 2>/dev/null | head -80 || echo "NO .medusa dir" ; \
    echo "=== Looking for index.html ===" && \
    find / -name "index.html" -path "*admin*" 2>/dev/null || echo "NO admin index.html anywhere"

ENV NODE_ENV=production
WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["sh", "-c", "echo '=== RUNTIME: Build log tail ===' && tail -50 /tmp/medusa-build.log 2>/dev/null && echo '=== RUNTIME: .medusa contents ===' && find .medusa -type f 2>/dev/null | head -40 && echo '=== RUNTIME: admin dir ===' && ls -laR .medusa/server/public/ 2>/dev/null || echo 'NO .medusa/server/public/' && echo '=== STARTING SERVER ===' && pnpm medusa db:migrate && pnpm medusa start -H 0.0.0.0"]
