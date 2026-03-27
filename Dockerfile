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
    echo "=== Build done ===" && \
    if [ -d "dist/public/admin" ]; then \
      echo "Admin found — copying" && \
      mkdir -p public/admin && \
      cp -r dist/public/admin/* public/admin/ ; \
    else \
      echo "WARN: No admin build output" ; \
    fi && \
    echo "=== .medusa/server check ===" && \
    ls .medusa/server/medusa-config.js 2>/dev/null && echo "Server build OK" || echo "WARN: no compiled server"

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"
WORKDIR /app/apps/backend
EXPOSE 8080

CMD ["sh", "-c", "\
  echo '########## LUMINE BOOT ##########' && \
  echo \"HEAP=$NODE_OPTIONS\" && \
  TOTAL_MEM=$(awk '/MemTotal/{printf \"%.0f\", $2/1024}' /proc/meminfo) && \
  echo \"TOTAL_RAM=${TOTAL_MEM}MB\" && \
  echo \"DB=$([ -n \"$DATABASE_URL\" ] && echo OK || echo MISSING!)\" && \
  echo \"REDIS=$([ -n \"$REDIS_URL\" ] && echo OK || echo not-set)\" && \
  echo '##################################' && \
  echo '>>> Running migrations...' && \
  pnpm medusa db:migrate 2>&1 && \
  echo '>>> Migrations done' && \
  FREE_BEFORE=$(awk '/MemAvailable/{printf \"%.0f\", $2/1024}' /proc/meminfo) && \
  echo \">>> Free RAM before start: ${FREE_BEFORE}MB\" && \
  echo '>>> Starting Medusa on port 8080...' && \
  (while true; do sleep 10; MU=$(awk '/MemAvailable/{printf \"%.0f\", $2/1024}' /proc/meminfo); echo \"[watchdog] Free RAM: ${MU}MB\"; done) & \
  exec pnpm medusa start -H 0.0.0.0 -p 8080 \
"]
