# ADR 0003: Typed Arrays for Canvas State

## Status

Accepted

## Context

Pixel canvases need frequent random access and efficient rendering.

## Decision

Store in-memory pixels as a flat `Uint32Array` packed as `0xRRGGBBAA`.

## Consequences

Rendering to `ImageData` is fast and memory usage is predictable. Database persistence uses encoded snapshots rather than per-pixel rows.
