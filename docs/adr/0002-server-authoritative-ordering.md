# ADR 0002: Server-Authoritative Operation Ordering

## Status

Accepted

## Context

Multiple users may edit the same pixel at nearly the same time. Client clocks cannot be trusted.

## Decision

The realtime server assigns the sequence number for each accepted operation and broadcasts that sequence to all room members.

## Consequences

Conflict resolution is deterministic and simple. Offline divergent editing is limited; a CRDT would be considered if branchable offline edits become a requirement.
