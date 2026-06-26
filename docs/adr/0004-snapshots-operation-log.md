# ADR 0004: Snapshot Plus Operation-Log Persistence

## Status

Accepted

## Context

Writing a full canvas on every pointer movement would be wasteful, but replaying an unbounded operation log is also unsafe.

## Decision

Append accepted operations and periodically persist compressed snapshots. Explicit versions point to snapshots.

## Consequences

Recovery is efficient, replay windows are bounded, and important checkpoints are durable.
