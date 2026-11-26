# syntax=docker/dockerfile:1
# Build context: depo kökü →  docker build -f apps/web/Dockerfile .

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json tsconfig.base.json pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --filter @kuzhan/web...; \
    else pnpm install --no-frozen-lockfile --filter @kuzhan/web...; fi
COPY packages/shared packages/shared
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @kuzhan/shared build && pnpm --filter @kuzhan/web build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
