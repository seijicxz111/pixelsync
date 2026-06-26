import {
  type ClientCanvasOperation,
  type PixelChange,
  type PixelBuffer,
  applyCanvasOperation
} from "@pixelsync/shared";

export function createSetPixelsOperation(input: {
  projectId: string;
  canvasId: string;
  changes: readonly PixelChange[];
  clientRevision?: number;
}): ClientCanvasOperation {
  const operation = {
    operationId: crypto.randomUUID(),
    projectId: input.projectId,
    canvasId: input.canvasId,
    clientTimestamp: Date.now(),
    operationType: "PIXELS_SET",
    payload: {
      changes: [...input.changes]
    }
  } satisfies ClientCanvasOperation;

  if (input.clientRevision !== undefined) {
    return { ...operation, clientRevision: input.clientRevision };
  }

  return operation;
}

export function createClearOperation(input: {
  projectId: string;
  canvasId: string;
  color?: number;
  clientRevision?: number;
}): ClientCanvasOperation {
  const operation = {
    operationId: crypto.randomUUID(),
    projectId: input.projectId,
    canvasId: input.canvasId,
    clientTimestamp: Date.now(),
    operationType: "CANVAS_CLEAR",
    payload: {
      color: input.color ?? 0
    }
  } satisfies ClientCanvasOperation;

  if (input.clientRevision !== undefined) {
    return { ...operation, clientRevision: input.clientRevision };
  }

  return operation;
}

export function diffPixelBuffers(before: Uint32Array, after: Uint32Array, width: number): PixelChange[] {
  const changes: PixelChange[] = [];
  const length = Math.min(before.length, after.length);

  for (let index = 0; index < length; index += 1) {
    const next = after[index];
    if (next !== undefined && before[index] !== next) {
      changes.push({ x: index % width, y: Math.floor(index / width), color: next });
    }
  }

  return changes;
}

export function applyOperationToEditorBuffer(buffer: PixelBuffer, operation: ClientCanvasOperation): PixelBuffer {
  return applyCanvasOperation(buffer, operation);
}
