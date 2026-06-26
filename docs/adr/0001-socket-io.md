# ADR 0001: Choose Socket.IO Instead of a Managed Collaboration Service

## Status

Accepted

## Context

PixelSync needs realtime rooms, reconnects, presence, cursor movement, and ordered canvas operations.

## Decision

Use Socket.IO on a separate Node/Fastify service.

## Consequences

This keeps synchronization, authorization, persistence, and scaling behavior transparent. It requires operating a realtime service and Redis adapter instead of outsourcing collaboration semantics.
