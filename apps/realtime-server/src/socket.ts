import { type FastifyInstance } from "fastify";
import { Server, type Socket } from "socket.io";
import {
  clientToServerEvents,
  operationPayloadSize,
  pixelChangeSchema,
  type ClientCanvasOperation,
  type PresenceUser,
  type ServerToClientPayload
} from "@pixelsync/shared";
import { canJoinProject, canModifyProject, resolveSocketIdentity, type SocketIdentity } from "./auth";
import { env } from "./env";
import { logger } from "./logger";
import { PresenceStore } from "./presence";
import { prisma } from "./prisma";
import { configureRedisAdapter, type RedisClients } from "./redis";
import { RoomStore, type CanvasRoom } from "./room-store";
import { SocketRateLimiter } from "./rate-limit";

type SocketData = {
  identity: SocketIdentity;
  roomId?: string;
  projectId?: string;
  canvasId?: string;
};

type PixelSocket = Socket & {
  data: SocketData;
};

const roomStore = new RoomStore();
const rateLimiter = new SocketRateLimiter(120, 60);

export async function registerSocketServer(app: FastifyInstance): Promise<Server> {
  const io = new Server(app.server, {
    cors: {
      origin: env.WEB_ORIGIN,
      credentials: true
    },
    maxHttpBufferSize: 128 * 1024,
    pingTimeout: 20_000,
    pingInterval: 10_000
  });

  const redis = await configureRedisAdapter(io);
  const presence = new PresenceStore(redis);

  io.use(async (socket, next) => {
    try {
      const identity = await resolveSocketIdentity(socket);
      if (identity === null) {
        next(new Error("UNAUTHENTICATED"));
        return;
      }

      (socket as PixelSocket).data.identity = identity;
      next();
    } catch (error) {
      logger.warn({ error }, "Socket authentication failed.");
      next(new Error("UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    const pixelSocket = socket as PixelSocket;
    logger.info({ socketId: socket.id, userId: pixelSocket.data.identity.userId }, "Socket connected.");

    socket.on("room:join", (payload: unknown) => {
      void handleRoomJoin(io, pixelSocket, presence, payload);
    });

    socket.on("room:leave", (payload: unknown) => {
      void handleRoomLeave(io, pixelSocket, presence, payload);
    });

    socket.on("presence:update", (payload: unknown) => {
      void withRateLimit(pixelSocket, "presence", 1, () => handlePresenceUpdate(io, pixelSocket, presence, payload));
    });

    socket.on("cursor:move", (payload: unknown) => {
      void withRateLimit(pixelSocket, "cursor", 1, () => handleCursorMove(io, pixelSocket, presence, payload));
    });

    socket.on("canvas:operation", (payload: unknown) => {
      void withRateLimit(pixelSocket, "operation", 4, () => handleCanvasOperation(io, pixelSocket, payload));
    });

    socket.on("canvas:sync-request", (payload: unknown) => {
      void handleSyncRequest(pixelSocket, payload);
    });

    socket.on("canvas:snapshot-request", (payload: unknown) => {
      void handleSnapshotRequest(pixelSocket, payload);
    });

    socket.on("version:create", (payload: unknown) => {
      void handleVersionCreate(io, pixelSocket, payload);
    });

    socket.on("disconnect", () => {
      void handleDisconnect(io, pixelSocket, presence);
      rateLimiter.delete(socket.id);
    });
  });

  registerSnapshotFallback(redis);
  return io;
}

async function handleRoomJoin(
  io: Server,
  socket: PixelSocket,
  presence: PresenceStore,
  payload: unknown
): Promise<void> {
  const parsed = clientToServerEvents["room:join"].safeParse(payload);
  if (!parsed.success) {
    emitError(socket, "BAD_REQUEST", "Room join payload is invalid.");
    return;
  }

  const { projectId, canvasId } = parsed.data;
  const identity = socket.data.identity;

  if (!(await canJoinProject(projectId, identity))) {
    emitError(socket, "FORBIDDEN", "You do not have access to this room.");
    return;
  }

  const room = await roomStore.load(projectId, canvasId);
  const roomId = room.roomId;
  socket.data.roomId = roomId;
  socket.data.projectId = projectId;
  socket.data.canvasId = canvasId;
  room.editorCount += 1;
  await socket.join(roomId);

  const userPresence = createPresence(identity, parsed.data.guestDisplayName);
  await presence.set(roomId, userPresence);
  socket.to(roomId).emit("presence:joined", {
    projectId,
    canvasId,
    user: userPresence
  } satisfies ServerToClientPayload<"presence:joined">);

  const users = await presence.list(roomId);
  socket.emit("room:state", {
    projectId,
    canvasId,
    sequenceNumber: room.sequence,
    users,
    snapshot: roomStore.snapshot(room)
  } satisfies ServerToClientPayload<"room:state">);
}

async function handleRoomLeave(
  io: Server,
  socket: PixelSocket,
  presence: PresenceStore,
  payload: unknown
): Promise<void> {
  const parsed = clientToServerEvents["room:leave"].safeParse(payload);
  if (!parsed.success) {
    return;
  }

  await leaveCurrentRoom(io, socket, presence);
}

async function handlePresenceUpdate(
  io: Server,
  socket: PixelSocket,
  presence: PresenceStore,
  payload: unknown
): Promise<void> {
  const parsed = clientToServerEvents["presence:update"].safeParse(payload);
  if (!parsed.success || socket.data.roomId === undefined) {
    emitError(socket, "BAD_REQUEST", "Presence payload is invalid.");
    return;
  }

  const updated = createPresence(socket.data.identity);
  updated.activeTool = parsed.data.activeTool;
  updated.selectedColor = parsed.data.selectedColor;
  updated.status = parsed.data.status ?? "CONNECTED";
  await presence.set(socket.data.roomId, updated);
  io.to(socket.data.roomId).emit("presence:updated", {
    projectId: parsed.data.projectId,
    canvasId: parsed.data.canvasId,
    user: updated
  } satisfies ServerToClientPayload<"presence:updated">);
}

async function handleCursorMove(
  io: Server,
  socket: PixelSocket,
  presence: PresenceStore,
  payload: unknown
): Promise<void> {
  const parsed = clientToServerEvents["cursor:move"].safeParse(payload);
  if (!parsed.success || socket.data.roomId === undefined) {
    return;
  }

  const updated = createPresence(socket.data.identity);
  updated.cursor = { x: parsed.data.x, y: parsed.data.y };
  await presence.set(socket.data.roomId, updated);
  socket.to(socket.data.roomId).emit("cursor:moved", {
    projectId: parsed.data.projectId,
    canvasId: parsed.data.canvasId,
    userId: socket.data.identity.userId,
    x: parsed.data.x,
    y: parsed.data.y
  } satisfies ServerToClientPayload<"cursor:moved">);
}

async function handleCanvasOperation(io: Server, socket: PixelSocket, payload: unknown): Promise<void> {
  const parsed = clientToServerEvents["canvas:operation"].safeParse(payload);
  if (!parsed.success) {
    emitError(socket, "BAD_REQUEST", "Canvas operation payload is invalid.");
    return;
  }

  const operation = parsed.data;
  const roomId = socket.data.roomId;
  const room = roomId === undefined ? null : roomStore.get(roomId);

  if (room === null || room.projectId !== operation.projectId || room.canvasId !== operation.canvasId) {
    emitError(socket, "ROOM_NOT_FOUND", "Join the room before sending canvas operations.");
    return;
  }

  if (!(await canModifyProject(operation.projectId, socket.data.identity))) {
    emitError(socket, "FORBIDDEN", "You do not have permission to modify this canvas.");
    return;
  }

  if (operationPayloadSize(operation) > env.MAX_OPERATION_CHANGES) {
    emitError(socket, "PAYLOAD_TOO_LARGE", "Canvas operation is too large.");
    return;
  }

  if (!operationCoordinatesAreValid(operation, room)) {
    emitError(socket, "BAD_REQUEST", "Canvas operation coordinates are outside the canvas.");
    return;
  }

  const accepted = await roomStore.acceptOperation(room, {
    ...operation,
    userId: socket.data.identity.userId
  });

  if (accepted === null) {
    return;
  }

  io.to(room.roomId).emit("canvas:operation-applied", {
    operation: accepted
  } satisfies ServerToClientPayload<"canvas:operation-applied">);
}

async function handleSyncRequest(socket: PixelSocket, payload: unknown): Promise<void> {
  const parsed = clientToServerEvents["canvas:sync-request"].safeParse(payload);
  const room = socket.data.roomId === undefined ? null : roomStore.get(socket.data.roomId);
  if (!parsed.success || room === null) {
    emitError(socket, "BAD_REQUEST", "Sync request is invalid.");
    return;
  }

  const operations = roomStore.operationsAfter(room, parsed.data.afterSequence);
  if (operations === null) {
    socket.emit("canvas:resync-required", {
      projectId: parsed.data.projectId,
      canvasId: parsed.data.canvasId,
      reason: "MISSING_OPERATIONS",
      lastAvailableSequence: room.sequence
    } satisfies ServerToClientPayload<"canvas:resync-required">);
    return;
  }

  for (const operation of operations) {
    socket.emit("canvas:operation-applied", {
      operation
    } satisfies ServerToClientPayload<"canvas:operation-applied">);
  }
}

async function handleSnapshotRequest(socket: PixelSocket, payload: unknown): Promise<void> {
  const parsed = clientToServerEvents["canvas:snapshot-request"].safeParse(payload);
  const room = socket.data.roomId === undefined ? null : roomStore.get(socket.data.roomId);
  if (!parsed.success || room === null) {
    emitError(socket, "BAD_REQUEST", "Snapshot request is invalid.");
    return;
  }

  socket.emit("canvas:snapshot", {
    projectId: parsed.data.projectId,
    canvasId: parsed.data.canvasId,
    snapshot: roomStore.snapshot(room)
  } satisfies ServerToClientPayload<"canvas:snapshot">);
}

async function handleVersionCreate(io: Server, socket: PixelSocket, payload: unknown): Promise<void> {
  const parsed = clientToServerEvents["version:create"].safeParse(payload);
  const room = socket.data.roomId === undefined ? null : roomStore.get(socket.data.roomId);

  if (!parsed.success || room === null) {
    emitError(socket, "BAD_REQUEST", "Version request is invalid.");
    return;
  }

  if (!(await canModifyProject(parsed.data.projectId, socket.data.identity))) {
    emitError(socket, "FORBIDDEN", "You do not have permission to create versions.");
    return;
  }

  const snapshotId = await roomStore.persistSnapshot(room, socket.data.identity.userId);
  if (snapshotId === null) {
    emitError(socket, "INTERNAL", "Version snapshot could not be saved.");
    return;
  }

  const version = await prisma.canvasVersion.create({
    data: {
      canvasId: parsed.data.canvasId,
      snapshotId,
      label: parsed.data.label,
      description: parsed.data.description ?? null,
      createdById: socket.data.identity.userId
    }
  });

  io.to(room.roomId).emit("version:created", {
    projectId: parsed.data.projectId,
    canvasId: parsed.data.canvasId,
    versionId: version.id,
    label: version.label,
    sequenceNumber: room.sequence,
    createdById: socket.data.identity.userId,
    createdAt: version.createdAt.toISOString()
  } satisfies ServerToClientPayload<"version:created">);
}

async function handleDisconnect(io: Server, socket: PixelSocket, presence: PresenceStore): Promise<void> {
  await leaveCurrentRoom(io, socket, presence);
  logger.info({ socketId: socket.id, userId: socket.data.identity.userId }, "Socket disconnected.");
}

async function leaveCurrentRoom(io: Server, socket: PixelSocket, presence: PresenceStore): Promise<void> {
  const roomId = socket.data.roomId;
  const projectId = socket.data.projectId;
  const canvasId = socket.data.canvasId;

  if (roomId === undefined || projectId === undefined || canvasId === undefined) {
    return;
  }

  await presence.delete(roomId, socket.data.identity.userId);
  socket.to(roomId).emit("presence:left", {
    projectId,
    canvasId,
    userId: socket.data.identity.userId
  } satisfies ServerToClientPayload<"presence:left">);
  await socket.leave(roomId);

  const room = roomStore.get(roomId);
  if (room !== null) {
    room.editorCount = Math.max(0, room.editorCount - 1);
  }

  await roomStore.closeIfEmpty(roomId, socket.data.identity.isGuest ? null : socket.data.identity.userId);
  delete socket.data.roomId;
  delete socket.data.projectId;
  delete socket.data.canvasId;
}

async function withRateLimit(
  socket: PixelSocket,
  bucket: string,
  cost: number,
  action: () => Promise<void>
): Promise<void> {
  if (!rateLimiter.consume(`${socket.id}:${bucket}`, cost)) {
    emitError(socket, "RATE_LIMITED", "You are sending updates too quickly.");
    return;
  }

  await action();
}

function operationCoordinatesAreValid(operation: ClientCanvasOperation, room: CanvasRoom): boolean {
  if (operation.operationType !== "PIXELS_SET") {
    return true;
  }

  for (const change of operation.payload.changes) {
    const result = pixelChangeSchema.safeParse(change);
    if (!result.success || change.x >= room.buffer.width || change.y >= room.buffer.height) {
      return false;
    }
  }

  return true;
}

function createPresence(identity: SocketIdentity, guestDisplayName?: string): PresenceUser {
  return {
    userId: identity.userId,
    displayName: guestDisplayName ?? identity.displayName,
    avatarUrl: identity.avatarUrl,
    collaborationColor: colorForIdentity(identity.userId),
    activeTool: "PENCIL",
    selectedColor: 0x22d3eeff,
    cursor: null,
    status: "CONNECTED",
    lastActiveAt: new Date().toISOString()
  };
}

function colorForIdentity(userId: string): string {
  const colors = ["#22d3ee", "#f472b6", "#a7f3d0", "#facc15", "#fb7185", "#c4b5fd"];
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash + userId.charCodeAt(index)) % colors.length;
  }
  return colors[hash] ?? "#22d3ee";
}

function emitError(
  socket: Socket,
  code: ServerToClientPayload<"server:error">["code"],
  message: string
): void {
  socket.emit("server:error", { code, message } satisfies ServerToClientPayload<"server:error">);
}

function registerSnapshotFallback(redis: RedisClients | null): void {
  if (redis === null) {
    return;
  }

  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM; realtime server will exit after process manager grace period.");
  });
}
