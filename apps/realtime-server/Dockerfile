FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/realtime-server/package.json apps/realtime-server/package.json
COPY packages packages
RUN pnpm install

FROM deps AS build
COPY apps/realtime-server apps/realtime-server
COPY prisma prisma
COPY tsconfig.base.json eslint.config.mjs ./
RUN pnpm --filter @pixelsync/realtime-server build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/realtime-server/dist apps/realtime-server/dist
COPY --from=build /app/package.json package.json
CMD ["node", "apps/realtime-server/dist/apps/realtime-server/src/index.js"]
