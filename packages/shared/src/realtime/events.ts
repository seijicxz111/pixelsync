import { z } from "zod";
import {
  alignmentSchema,
  canvasDimensionsBaseSchema,
  pixelChangeSchema,
  pixelToolSchema,
  rgbaColorSchema
} from "../pixel";

export const MAX_OPERATION_CHANGES = 4096;
export const MAX_CHAT_MESSAGE_LENGTH = 512;

export const entityIdSchema = z.string().min(6).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export const operationIdSchema = z.string().uuid();
export const sequenceNumberSchema = z.number().int().nonnegative();

export const collaborationStatusSchema = z.enum([
  "CONNECTING",
  "CONNECTED",
  "RECONNECTING",
  "OFFLINE",
  "FAILED"
]);

export const presenceUserSchema = z.object({
  userId: entityIdSchema,
  displayName: z.string().min(1).max(80),
  avatarUrl: z.string().url().nullable(),
  collaborationColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  activeTool: pixelToolSchema,
  selectedColor: rgbaColorSchema,
  cursor: z
    .object({
      x: z.number().int().min(0),
      y: z.number().int().min(0)
    })
    .nullable(),
  status: collaborationStatusSchema,
  lastActiveAt: z.string().datetime()
});

export const encodedSnapshotSchema = z.object({
  format: z.literal("rgba-rle-v1"),
  width: z.number().int().min(1).max(512),
  height: z.number().int().min(1).max(512),
  data: z.string().min(1),
  sequenceNumber: sequenceNumberSchema
});

const operationBaseSchema = z.object({
  operationId: operationIdSchema,
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  clientTimestamp: z.number().int().positive(),
  clientRevision: z.number().int().nonnegative().optional()
});

export const setPixelsPayloadSchema = z.object({
  changes: z.array(pixelChangeSchema).min(1).max(MAX_OPERATION_CHANGES)
});

export const clearCanvasPayloadSchema = z.object({
  color: rgbaColorSchema.default(0)
});

export const resizeCanvasPayloadSchema = canvasDimensionsBaseSchema.extend({
  alignment: alignmentSchema,
  fill: rgbaColorSchema.default(0)
});

const clientSetPixelsOperationSchema = operationBaseSchema.extend({
    operationType: z.literal("PIXELS_SET"),
    payload: setPixelsPayloadSchema
  });

const clientClearCanvasOperationSchema = operationBaseSchema.extend({
    operationType: z.literal("CANVAS_CLEAR"),
    payload: clearCanvasPayloadSchema
  });

const clientResizeCanvasOperationSchema = operationBaseSchema.extend({
    operationType: z.literal("CANVAS_RESIZE"),
    payload: resizeCanvasPayloadSchema
  });

export const clientCanvasOperationSchema = z.discriminatedUnion("operationType", [
  clientSetPixelsOperationSchema,
  clientClearCanvasOperationSchema,
  clientResizeCanvasOperationSchema
]);

const acceptedOperationBaseSchema = operationBaseSchema.extend({
    userId: entityIdSchema,
    sequenceNumber: sequenceNumberSchema,
    serverTimestamp: z.number().int().positive()
  });

const acceptedSetPixelsOperationSchema = acceptedOperationBaseSchema.extend({
  operationType: z.literal("PIXELS_SET"),
  payload: setPixelsPayloadSchema
});

const acceptedClearCanvasOperationSchema = acceptedOperationBaseSchema.extend({
  operationType: z.literal("CANVAS_CLEAR"),
  payload: clearCanvasPayloadSchema
});

const acceptedResizeCanvasOperationSchema = acceptedOperationBaseSchema.extend({
  operationType: z.literal("CANVAS_RESIZE"),
  payload: resizeCanvasPayloadSchema
});

export const acceptedCanvasOperationSchema = z.discriminatedUnion("operationType", [
  acceptedSetPixelsOperationSchema,
  acceptedClearCanvasOperationSchema,
  acceptedResizeCanvasOperationSchema
]);

export const roomJoinPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  inviteToken: z.string().min(20).max(256).optional(),
  guestDisplayName: z.string().min(1).max(60).optional(),
  lastSeenSequence: sequenceNumberSchema.optional()
});

export const roomLeavePayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema
});

export const presenceUpdatePayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  activeTool: pixelToolSchema,
  selectedColor: rgbaColorSchema,
  status: collaborationStatusSchema.optional()
});

export const cursorMovePayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  x: z.number().int().min(0).max(511),
  y: z.number().int().min(0).max(511)
});

export const syncRequestPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  afterSequence: sequenceNumberSchema
});

export const snapshotRequestPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema
});

export const versionCreatePayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  label: z.string().min(1).max(80),
  description: z.string().max(1000).optional()
});

export const chatMessagePayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  message: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH)
});

export const roomStatePayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  sequenceNumber: sequenceNumberSchema,
  users: z.array(presenceUserSchema),
  snapshot: encodedSnapshotSchema.nullable()
});

export const presenceEventPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  user: presenceUserSchema
});

export const presenceLeftPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  userId: entityIdSchema
});

export const cursorMovedPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  userId: entityIdSchema,
  x: z.number().int().min(0).max(511),
  y: z.number().int().min(0).max(511)
});

export const operationAppliedPayloadSchema = z.object({
  operation: acceptedCanvasOperationSchema
});

export const snapshotPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  snapshot: encodedSnapshotSchema
});

export const resyncRequiredPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  reason: z.enum(["MISSING_OPERATIONS", "STALE_CLIENT", "SNAPSHOT_COMPACTED", "PERMISSION_CHANGED"]),
  lastAvailableSequence: sequenceNumberSchema
});

export const versionCreatedPayloadSchema = z.object({
  projectId: entityIdSchema,
  canvasId: entityIdSchema,
  versionId: entityIdSchema,
  label: z.string(),
  sequenceNumber: sequenceNumberSchema,
  createdById: entityIdSchema,
  createdAt: z.string().datetime()
});

export const serverErrorPayloadSchema = z.object({
  code: z.enum([
    "BAD_REQUEST",
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "RATE_LIMITED",
    "PAYLOAD_TOO_LARGE",
    "ROOM_NOT_FOUND",
    "CONFLICT",
    "INTERNAL"
  ]),
  message: z.string(),
  requestId: z.string().optional()
});

export const clientToServerEvents = {
  "room:join": roomJoinPayloadSchema,
  "room:leave": roomLeavePayloadSchema,
  "presence:update": presenceUpdatePayloadSchema,
  "cursor:move": cursorMovePayloadSchema,
  "canvas:operation": clientCanvasOperationSchema,
  "canvas:sync-request": syncRequestPayloadSchema,
  "canvas:snapshot-request": snapshotRequestPayloadSchema,
  "version:create": versionCreatePayloadSchema,
  "chat:message": chatMessagePayloadSchema
} as const;

export const serverToClientEvents = {
  "room:state": roomStatePayloadSchema,
  "presence:joined": presenceEventPayloadSchema,
  "presence:left": presenceLeftPayloadSchema,
  "presence:updated": presenceEventPayloadSchema,
  "cursor:moved": cursorMovedPayloadSchema,
  "canvas:operation-applied": operationAppliedPayloadSchema,
  "canvas:snapshot": snapshotPayloadSchema,
  "canvas:resync-required": resyncRequiredPayloadSchema,
  "version:created": versionCreatedPayloadSchema,
  "server:error": serverErrorPayloadSchema
} as const;

export type ClientToServerEvent = keyof typeof clientToServerEvents;
export type ServerToClientEvent = keyof typeof serverToClientEvents;
export type ClientToServerPayload<TEvent extends ClientToServerEvent> = z.infer<
  (typeof clientToServerEvents)[TEvent]
>;
export type ServerToClientPayload<TEvent extends ServerToClientEvent> = z.infer<
  (typeof serverToClientEvents)[TEvent]
>;
export type PresenceUser = z.infer<typeof presenceUserSchema>;
export type ClientCanvasOperation = z.infer<typeof clientCanvasOperationSchema>;
export type AcceptedCanvasOperation = z.infer<typeof acceptedCanvasOperationSchema>;

export function operationPayloadSize(operation: ClientCanvasOperation): number {
  if (operation.operationType === "PIXELS_SET") {
    return operation.payload.changes.length;
  }

  if (operation.operationType === "CANVAS_RESIZE") {
    return 1;
  }

  return 1;
}
