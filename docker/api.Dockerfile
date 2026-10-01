FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/wa-core/package.json ./packages/wa-core/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile || pnpm install

FROM dependencies AS build
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/wa-core ./packages/wa-core
COPY apps/api ./apps/api
RUN pnpm --filter @waflame/shared build
RUN pnpm --filter @waflame/database db:generate
RUN pnpm --filter @waflame/database build
RUN pnpm --filter @waflame/wa-core build
RUN pnpm --filter @waflame/api build

FROM base AS runner
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/database/dist ./packages/database/dist
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/packages/database/package.json ./packages/database/
COPY --from=build /app/packages/wa-core/dist ./packages/wa-core/dist
COPY --from=build /app/packages/wa-core/package.json ./packages/wa-core/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
