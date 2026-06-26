# Architecture

PixelSync uses a monorepo with a clear split between web UI, realtime collaboration, and shared contracts.

```mermaid
flowchart TB
  UI[React Editor + Zustand] --> Shared[Shared Pixel Engine + Event Schemas]
  UI --> HTTP[Next.js Route Handlers]
  UI --> WS[Socket.IO Client]
  HTTP --> Prisma[Prisma]
  WS --> RT[Fastify Socket.IO Server]
  RT --> Shared
  RT --> Prisma
  RT --> Redis[Redis Adapter + Presence TTL]
  Prisma --> Postgres[(Postgres)]
```

The web app owns product workflows: auth, dashboard, project/canvas creation, invites, versions, public viewer, and editor rendering. The realtime server owns volatile collaboration state: room membership, presence, cursor updates, operation ordering, dedupe, and persistence flushes.

The shared package prevents frontend/server drift by centralizing socket schemas, pixel encoding, drawing algorithms, permission helpers, and reconciliation logic.
