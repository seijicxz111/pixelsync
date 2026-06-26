import {
  applyCanvasOperation,
  createPixelBuffer,
  decodeSnapshot,
  encodeSnapshot,
  OperationDeduper,
  type AcceptedCanvasOperation,
  type PixelBuffer,
  type SnapshotEncoding
} from "@pixelsync/shared";
import { prisma } from "./prisma";
import { env } from "./env";
import { logger } from "./logger";

export type CanvasRoom = {
  roomId: string;
  projectId: string;
  canvasId: string;
  buffer: PixelBuffer;
  sequence: number;
  operations: AcceptedCanvasOperation[];
  deduper: OperationDeduper;
  editorCount: number;
  dirtyOperationsSinceSnapshot: number;
};

export class RoomStore {
  private readonly rooms = new Map<string, CanvasRoom>();

  public roomId(projectId: string, canvasId: string): string {
    return `${projectId}:${canvasId}`;
  }

  public get(roomId: string): CanvasRoom | null {
    return this.rooms.get(roomId) ?? null;
  }

  public async load(projectId: string, canvasId: string): Promise<CanvasRoom> {
    const roomId = this.roomId(projectId, canvasId);
    const existing = this.rooms.get(roomId);
    if (existing !== undefined) {
      return existing;
    }

    const canvas = await prisma.canvas.findFirst({
      where: { id: canvasId, projectId },
      include: {
        snapshots: {
          orderBy: { sequenceNumber: "desc" },
          take: 1
        }
      }
    });

    if (canvas === null) {
      throw new Error("Canvas not found.");
    }

    const snapshot =
      canvas.currentSnapshotId === null
        ? canvas.snapshots[0]
        : await prisma.canvasSnapshot.findUnique({ where: { id: canvas.currentSnapshotId } });

    const parsedSnapshot =
      snapshot === null || snapshot === undefined
        ? null
        : (JSON.parse(snapshot.encodedPixelData) as SnapshotEncoding);
    const buffer =
      parsedSnapshot === null ? createPixelBuffer(canvas.width, canvas.height) : decodeSnapshot(parsedSnapshot);
    let sequence = snapshot?.sequenceNumber ?? canvas.currentSequence;

    const persistedOperations = await prisma.canvasOperation.findMany({
      where: {
        canvasId,
        sequenceNumber: { gt: sequence }
      },
      orderBy: { sequenceNumber: "asc" }
    });

    for (const persisted of persistedOperations) {
      const operation = {
        operationId: persisted.id,
        projectId,
        canvasId,
        userId: persisted.userId,
        sequenceNumber: persisted.sequenceNumber,
        serverTimestamp: persisted.createdAt.getTime(),
        clientTimestamp: persisted.createdAt.getTime(),
        operationType: persisted.operationType,
        payload: persisted.payload
      } as AcceptedCanvasOperation;
      applyCanvasOperation(buffer, operation);
      sequence = operation.sequenceNumber;
    }

    const room: CanvasRoom = {
      roomId,
      projectId,
      canvasId,
      buffer,
      sequence,
      operations: [],
      deduper: new OperationDeduper(),
      editorCount: 0,
      dirtyOperationsSinceSnapshot: 0
    };

    this.rooms.set(roomId, room);
    return room;
  }

  public async acceptOperation(
    room: CanvasRoom,
    operation: Omit<AcceptedCanvasOperation, "sequenceNumber" | "serverTimestamp">
  ): Promise<AcceptedCanvasOperation | null> {
    if (!room.deduper.add(operation.operationId)) {
      return null;
    }

    const accepted = {
      ...operation,
      sequenceNumber: room.sequence + 1,
      serverTimestamp: Date.now()
    } as AcceptedCanvasOperation;

    room.sequence = accepted.sequenceNumber;
    const nextBuffer = applyCanvasOperation(room.buffer, accepted);
    room.buffer = nextBuffer;
    room.operations.push(accepted);
    room.operations = room.operations.slice(-5_000);
    room.dirtyOperationsSinceSnapshot += 1;

    await prisma.$transaction([
      prisma.canvasOperation.create({
        data: {
          id: accepted.operationId,
          canvasId: accepted.canvasId,
          userId: accepted.userId,
          sequenceNumber: accepted.sequenceNumber,
          operationType: accepted.operationType,
          payload: accepted.payload
        }
      }),
      prisma.canvas.update({
        where: { id: accepted.canvasId },
        data: { currentSequence: accepted.sequenceNumber }
      })
    ]);

    if (room.dirtyOperationsSinceSnapshot >= env.SNAPSHOT_INTERVAL) {
      await this.persistSnapshot(room, accepted.userId);
    }

    return accepted;
  }

  public operationsAfter(room: CanvasRoom, sequence: number): AcceptedCanvasOperation[] | null {
    if (sequence >= room.sequence) {
      return [];
    }

    const next = room.operations.filter((operation) => operation.sequenceNumber > sequence);
    if (next.length === room.sequence - sequence) {
      return next;
    }

    return null;
  }

  public snapshot(room: CanvasRoom): SnapshotEncoding & { sequenceNumber: number } {
    return {
      ...encodeSnapshot(room.buffer),
      sequenceNumber: room.sequence
    };
  }

  public async persistSnapshot(room: CanvasRoom, createdById: string | null): Promise<string | null> {
    const snapshot = this.snapshot(room);

    try {
      const created = await prisma.canvasSnapshot.upsert({
        where: {
          canvasId_sequenceNumber: {
            canvasId: room.canvasId,
            sequenceNumber: room.sequence
          }
        },
        update: {
          width: snapshot.width,
          height: snapshot.height,
          encodedPixelData: JSON.stringify(snapshot),
          createdById
        },
        create: {
          canvasId: room.canvasId,
          width: snapshot.width,
          height: snapshot.height,
          encodedPixelData: JSON.stringify(snapshot),
          sequenceNumber: room.sequence,
          createdById
        }
      });

      await prisma.canvas.update({
        where: { id: room.canvasId },
        data: {
          currentSnapshotId: created.id,
          currentSequence: room.sequence,
          width: snapshot.width,
          height: snapshot.height
        }
      });

      room.dirtyOperationsSinceSnapshot = 0;
      return created.id;
    } catch (error) {
      logger.error({ error, roomId: room.roomId }, "Failed to persist canvas snapshot.");
      return null;
    }
  }

  public async closeIfEmpty(roomId: string, createdById: string | null): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room === undefined || room.editorCount > 0) {
      return;
    }

    if (room.dirtyOperationsSinceSnapshot > 0) {
      await this.persistSnapshot(room, createdById);
    }

    this.rooms.delete(roomId);
  }
}
