# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["pnpm", "dev"]

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY apps/api/package.json ./apps/api/
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main"]
