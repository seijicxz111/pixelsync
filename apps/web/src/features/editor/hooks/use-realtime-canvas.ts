"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  applyCanvasOperation,
  type AcceptedCanvasOperation,
  type ClientCanvasOperation,
  type Coordinate,
  createReconciliationState,
  reconcileAcceptedOperation,
  type PresenceUser,
  type ServerToClientPayload
} from "@pixelsync/shared";
import { useEditorStore } from "../store/use-editor-store";

type ConnectionStatus = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "OFFLINE" | "FAILED";

type UseRealtimeCanvasInput = {
  projectId: string;
  canvasId: string;
  currentUserId: string | null;
  displayName: string;
  avatarUrl: string | null;
  canEdit: boolean;
};

type UseRealtimeCanvasResult = {
  status: ConnectionStatus;
  remoteUsers: PresenceUser[];
  sendOperation: (operation: ClientCanvasOperation) => void;
  sendCursorMove: (coordinate: Coordinate) => void;
};

export function useRealtimeCanvas({
  projectId,
  canvasId,
  currentUserId,
  displayName,
  avatarUrl,
  canEdit
}: UseRealtimeCanvasInput): UseRealtimeCanvasResult {
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");
  const [remoteUsers, setRemoteUsers] = useState<PresenceUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const queuedOperations = useRef<ClientCanvasOperation[]>([]);
  const reconciliationState = useRef(createReconciliationState());
  const lastCursorSentAt = useRef(0);

  const sendOperation = useCallback(
    (operation: ClientCanvasOperation) => {
      if (!canEdit) {
        return;
      }

      useEditorStore.getState().addPendingOperation(operation.operationId);
      const socket = socketRef.current;

      if (socket?.connected) {
        socket.emit("canvas:operation", operation);
        return;
      }

      queuedOperations.current.push(operation);
      setStatus("OFFLINE");
    },
    [canEdit]
  );

  const sendCursorMove = useCallback(
    (coordinate: Coordinate) => {
      const now = performance.now();
      if (now - lastCursorSentAt.current < 45) {
        return;
      }

      lastCursorSentAt.current = now;
      const socket = socketRef.current;

      if (!socket?.connected) {
        return;
      }

      socket.emit("cursor:move", { projectId, canvasId, x: coordinate.x, y: coordinate.y });
    },
    [canvasId, projectId]
  );

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        projectId,
        canvasId,
        displayName,
        avatarUrl,
        lastSeenSequence: useEditorStore.getState().lastConfirmedSequence
      }
    });

    socketRef.current = socket;
    setStatus("CONNECTING");

    socket.on("connect", () => {
      setStatus("CONNECTED");
      socket.emit("room:join", {
        projectId,
        canvasId,
        lastSeenSequence: useEditorStore.getState().lastConfirmedSequence
      });

      const queued = queuedOperations.current.splice(0);
      for (const operation of queued) {
        socket.emit("canvas:operation", operation);
      }
    });

    socket.on("disconnect", () => {
      setStatus("OFFLINE");
    });

    socket.io.on("reconnect_attempt", () => {
      setStatus("RECONNECTING");
    });

    socket.io.on("reconnect_failed", () => {
      setStatus("FAILED");
    });

    socket.on("room:state", (payload: ServerToClientPayload<"room:state">) => {
      setRemoteUsers(payload.users.filter((user) => user.userId !== currentUserId));
      useEditorStore.getState().setConnectedUsers(payload.users.length);
      if (payload.snapshot !== null) {
        useEditorStore.getState().setSnapshot(payload.snapshot, payload.sequenceNumber);
        reconciliationState.current = createReconciliationState(payload.sequenceNumber);
      } else {
        useEditorStore.getState().setSequence(payload.sequenceNumber);
        reconciliationState.current = createReconciliationState(payload.sequenceNumber);
      }
    });

    socket.on("presence:joined", (payload: ServerToClientPayload<"presence:joined">) => {
      if (payload.user.userId === currentUserId) {
        return;
      }
      setRemoteUsers((users) => upsertPresence(users, payload.user));
    });

    socket.on("presence:updated", (payload: ServerToClientPayload<"presence:updated">) => {
      if (payload.user.userId === currentUserId) {
        return;
      }
      setRemoteUsers((users) => upsertPresence(users, payload.user));
    });

    socket.on("presence:left", (payload: ServerToClientPayload<"presence:left">) => {
      setRemoteUsers((users) => users.filter((user) => user.userId !== payload.userId));
    });

    socket.on("cursor:moved", (payload: ServerToClientPayload<"cursor:moved">) => {
      if (payload.userId === currentUserId) {
        return;
      }

      setRemoteUsers((users) =>
        users.map((user) =>
          user.userId === payload.userId ? { ...user, cursor: { x: payload.x, y: payload.y } } : user
        )
      );
    });

    socket.on("canvas:operation-applied", (payload: ServerToClientPayload<"canvas:operation-applied">) => {
      handleAcceptedOperation(payload.operation, currentUserId, socket, projectId, canvasId, reconciliationState.current);
    });

    socket.on("canvas:snapshot", (payload: ServerToClientPayload<"canvas:snapshot">) => {
      useEditorStore.getState().setSnapshot(payload.snapshot, payload.snapshot.sequenceNumber);
      reconciliationState.current = createReconciliationState(payload.snapshot.sequenceNumber);
    });

    socket.on("canvas:resync-required", () => {
      socket.emit("canvas:snapshot-request", { projectId, canvasId });
    });

    socket.on("server:error", () => {
      setStatus("FAILED");
    });

    return () => {
      socket.emit("room:leave", { projectId, canvasId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [avatarUrl, canvasId, currentUserId, displayName, projectId]);

  return { status, remoteUsers, sendOperation, sendCursorMove };
}

function upsertPresence(users: PresenceUser[], user: PresenceUser): PresenceUser[] {
  const index = users.findIndex((item) => item.userId === user.userId);
  if (index === -1) {
    return [...users, user];
  }

  return users.map((item) => (item.userId === user.userId ? user : item));
}

function handleAcceptedOperation(
  operation: AcceptedCanvasOperation,
  currentUserId: string | null,
  socket: Socket,
  projectId: string,
  canvasId: string,
  state: ReturnType<typeof createReconciliationState>
): void {
  const decision = reconcileAcceptedOperation(state, operation);

  if (decision.action === "MISSING") {
    socket.emit("canvas:sync-request", {
      projectId,
      canvasId,
      afterSequence: state.lastConfirmedSequence
    });
    return;
  }

  if (decision.action !== "APPLY") {
    return;
  }

  const store = useEditorStore.getState();
  store.acknowledgeOperation(operation.operationId);
  store.setSequence(operation.sequenceNumber);

  if (operation.userId === currentUserId) {
    return;
  }

  const nextBuffer = applyCanvasOperation(store.buffer, operation);
  store.replaceBuffer(nextBuffer);
}
