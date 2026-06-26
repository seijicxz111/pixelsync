"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useCallback, useEffect } from "react";
import {
  applyCanvasOperation,
  type ClientCanvasOperation,
  type PixelChange,
  type SnapshotEncoding
} from "@pixelsync/shared";
import { Button } from "@pixelsync/ui";
import { CanvasStage } from "./canvas-stage";
import { ColorPanel } from "./color-panel";
import { DebugPanel } from "./debug-panel";
import { Minimap } from "./minimap";
import { PresencePanel } from "./presence-panel";
import { ShortcutDialog } from "./shortcut-dialog";
import { Toolbar } from "./toolbar";
import { VersionHistoryPanel } from "./version-history-panel";
import { createClearOperation, createSetPixelsOperation, diffPixelBuffers } from "../lib/operations";
import { useRealtimeCanvas } from "../hooks/use-realtime-canvas";
import { useEditorStore } from "../store/use-editor-store";

export type PixelEditorProps = {
  projectId: string;
  projectName: string;
  canvasId: string;
  canvasName: string;
  initialSnapshot: SnapshotEncoding;
  initialSequence: number;
  currentUser: {
    id: string | null;
    name: string;
    image: string | null;
  };
  canEdit: boolean;
  debug: boolean;
};

export function PixelEditor({
  projectId,
  projectName,
  canvasId,
  canvasName,
  initialSnapshot,
  initialSequence,
  currentUser,
  canEdit,
  debug
}: PixelEditorProps): JSX.Element {
  const setSnapshot = useEditorStore((state) => state.setSnapshot);
  const buffer = useEditorStore((state) => state.buffer);
  const revision = useEditorStore((state) => state.revision);
  const clear = useEditorStore((state) => state.clear);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const replaceBuffer = useEditorStore((state) => state.replaceBuffer);
  const { status, remoteUsers, sendOperation, sendCursorMove } = useRealtimeCanvas({
    projectId,
    canvasId,
    currentUserId: currentUser.id,
    displayName: currentUser.name,
    avatarUrl: currentUser.image,
    canEdit
  });

  useEffect(() => {
    setSnapshot(initialSnapshot, initialSequence);
  }, [initialSequence, initialSnapshot, setSnapshot]);

  const emitOperation = useCallback(
    (operation: ClientCanvasOperation) => {
      sendOperation(operation);
    },
    [sendOperation]
  );

  const sendDiffAsOperations = useCallback(
    (changes: PixelChange[]) => {
      const chunkSize = 4096;
      for (let index = 0; index < changes.length; index += chunkSize) {
        const chunk = changes.slice(index, index + chunkSize);
        emitOperation(createSetPixelsOperation({ projectId, canvasId, changes: chunk, clientRevision: revision }));
      }
    },
    [canvasId, emitOperation, projectId, revision]
  );

  useEffect(() => {
    function handleSaveVersion(): void {
      void fetch(`/api/canvases/${canvasId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: `Checkpoint ${new Date().toLocaleTimeString()}` })
      });
    }

    function handleClear(): void {
      if (!canEdit) {
        return;
      }
      clear();
      emitOperation(createClearOperation({ projectId, canvasId, clientRevision: revision }));
    }

    function handleUndo(): void {
      if (!canEdit) {
        return;
      }
      const before = new Uint32Array(useEditorStore.getState().buffer.pixels);
      undo();
      const afterState = useEditorStore.getState();
      const changes = diffPixelBuffers(before, afterState.buffer.pixels, afterState.buffer.width);
      sendDiffAsOperations(changes);
    }

    function handleRedo(): void {
      if (!canEdit) {
        return;
      }
      const before = new Uint32Array(useEditorStore.getState().buffer.pixels);
      redo();
      const afterState = useEditorStore.getState();
      const changes = diffPixelBuffers(before, afterState.buffer.pixels, afterState.buffer.width);
      sendDiffAsOperations(changes);
    }

    window.addEventListener("pixelsync:save-version", handleSaveVersion);
    window.addEventListener("pixelsync:clear", handleClear);
    window.addEventListener("pixelsync:undo", handleUndo);
    window.addEventListener("pixelsync:redo", handleRedo);

    return () => {
      window.removeEventListener("pixelsync:save-version", handleSaveVersion);
      window.removeEventListener("pixelsync:clear", handleClear);
      window.removeEventListener("pixelsync:undo", handleUndo);
      window.removeEventListener("pixelsync:redo", handleRedo);
    };
  }, [canEdit, canvasId, clear, emitOperation, projectId, redo, revision, sendDiffAsOperations, undo]);

  function handleRemoteOperation(operation: ClientCanvasOperation): void {
    if (operation.operationType !== "PIXELS_SET") {
      const next = applyCanvasOperation(buffer, operation);
      replaceBuffer(next);
    }
    emitOperation(operation);
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-950 text-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/projects/${projectId}`} className="rounded p-2 text-slate-300 hover:bg-white/10 hover:text-white">
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="sr-only">Back to project</span>
          </Link>
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-400">{projectName}</p>
            <h1 className="truncate text-sm font-semibold">{canvasName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VersionHistoryPanel canvasId={canvasId} />
          <ShortcutDialog />
          <Button variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent("pixelsync:save-version"))}>
            <Save size={18} aria-hidden="true" />
            Save
          </Button>
        </div>
      </header>
      <div role="status" aria-live="polite" className="sr-only">
        Connection status: {status}
      </div>
      <PresencePanel status={status} users={remoteUsers} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Toolbar canEdit={canEdit} />
        <div className="relative flex min-h-0 flex-1">
          <CanvasStage
            projectId={projectId}
            canvasId={canvasId}
            canEdit={canEdit}
            remoteUsers={remoteUsers}
            onOperation={handleRemoteOperation}
            onCursorMove={sendCursorMove}
          />
          <Minimap />
          <DebugPanel enabled={debug} />
        </div>
        <ColorPanel canvasName={canvasName} />
      </div>
    </div>
  );
}
