# Realtime Protocol

All events are defined in `packages/shared/src/realtime/events.ts` and validated with Zod on the realtime server.

## Client to Server

- `room:join`: join a project/canvas room with optional `lastSeenSequence`.
- `room:leave`: explicitly leave the room.
- `presence:update`: active tool, selected color, and connection state.
- `cursor:move`: throttled canvas-space cursor coordinates.
- `canvas:operation`: compact pixel, clear, or resize operation.
- `canvas:sync-request`: request operations after a confirmed sequence.
- `canvas:snapshot-request`: request a full snapshot.
- `version:create`: persist a named version from the current room state.
- `chat:message`: reserved validated event for room chat.

## Server to Client

- `room:state`: users, sequence, and current snapshot.
- `presence:*`: lifecycle updates for collaborators.
- `cursor:moved`: remote cursor movement.
- `canvas:operation-applied`: accepted operation with authoritative sequence.
- `canvas:snapshot`: full canvas snapshot.
- `canvas:resync-required`: incremental recovery is impossible.
- `version:created`: version broadcast.
- `server:error`: safe error code and user-facing message.

## Synchronization

Operations include a client operation ID, project ID, canvas ID, client timestamp, operation type, payload, authenticated user ID, server sequence, and server timestamp. Client clocks are not trusted for conflict resolution. Server order is authoritative.

Clients optimistically apply local edits and acknowledge them when the matching operation ID returns. Missing sequence numbers trigger `canvas:sync-request`; if the in-memory operation window no longer covers the gap, the server asks the client to resync from a snapshot.
