# Database Design

The schema is in `prisma/schema.prisma`.

Core entities:

- `User`, `Account`, `Session`, `VerificationToken`: Auth.js tables.
- `Project`: owner, visibility, thumbnail, guest policy.
- `ProjectMember`: role-based membership.
- `Canvas`: dimensions, background mode, current sequence, current snapshot pointer.
- `CanvasSnapshot`: compressed RGBA snapshot at a sequence.
- `CanvasOperation`: accepted operation log.
- `CanvasVersion`: explicit user-created checkpoint.
- `Invite`: hashed expiring tokens.
- `ActivityLog`: product activity feed.
- `ProjectPalette`: reusable color palettes.

Pixels are never stored one row at a time. In memory, pixels are `Uint32Array` values packed as `0xRRGGBBAA`. Snapshots are RLE-encoded and JSON-wrapped for database storage. Operations are appended as JSON payloads and periodically compacted into snapshots.
