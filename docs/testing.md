# Testing

## Unit

`packages/shared` contains Vitest coverage for:

- Pixel serialization/deserialization.
- Drawing algorithms.
- Fill bucket.
- Line and rectangle geometry.
- Coordinate transforms and zoom.
- Operation validation.
- Deduplication and sequence reconciliation.
- Permission utilities.

## Component

`apps/web` contains React Testing Library tests for toolbar behavior, color controls, share dialog, and presence/connection status.

## End-to-End

Playwright specs cover demo sign-in, project creation, public viewer access, and two browser contexts opening the same canvas. Full drawing/presence assertions require the realtime server and seeded database.

## Realtime Integration

`apps/realtime-server/test/realtime.integration.test.ts` can run against a seeded realtime service by setting:

```bash
REALTIME_TEST_URL=http://localhost:4000 pnpm --filter @pixelsync/realtime-server test
```
