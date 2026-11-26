# syntax=docker/dockerfile:1
# Build context: depo kökü →  docker build -f apps/api/Dockerfile .

FROM node:24-alpine AS base
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json tsconfig.base.json pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --filter @kuzhan/api...; \
    else pnpm install --no-frozen-lockfile --filter @kuzhan/api...; fi
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @kuzhan/shared build \
 && pnpm --filter @kuzhan/api build \
 && pnpm --filter @kuzhan/api deploy --prod /out \
 && cd /out && npx prisma generate

FROM node:24-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/system/health > /dev/null || exit 1
# Migration ayrı adımdır:  docker compose run --rm api npx prisma migrate deploy
CMD ["node", "dist/main.js"]
