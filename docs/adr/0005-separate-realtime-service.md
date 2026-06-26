# ADR 0005: Keep Realtime Service Separate from Vercel

## Status

Accepted

## Context

Persistent WebSocket connections do not fit Vercel serverless function lifecycles.

## Decision

Deploy the web app to Vercel and the realtime server to Railway or Fly.io.

## Consequences

The system supports long-lived Socket.IO connections, Redis adapter scaling, and controlled process shutdown behavior.
