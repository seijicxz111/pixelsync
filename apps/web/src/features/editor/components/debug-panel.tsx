"use client";

import { approximateMemoryUsage, useEditorStore } from "../store/use-editor-store";

export function DebugPanel({ enabled }: { enabled: boolean }): JSX.Element | null {
  const fps = useEditorStore((state) => state.fps);
  const latencyMs = useEditorStore((state) => state.latencyMs);
  const connectedUsers = useEditorStore((state) => state.connectedUsers);
  const sequence = useEditorStore((state) => state.lastConfirmedSequence);
  const pending = useEditorStore((state) => state.pendingOperationIds.length);
  const buffer = useEditorStore((state) => state.buffer);

  if (!enabled) {
    return null;
  }

  return (
    <aside className="absolute bottom-4 left-4 z-30 rounded bg-slate-950/90 p-3 text-xs text-slate-200 ring-1 ring-white/10">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt>FPS</dt><dd>{fps}</dd>
        <dt>Latency</dt><dd>{latencyMs} ms</dd>
        <dt>Users</dt><dd>{connectedUsers}</dd>
        <dt>Sequence</dt><dd>{sequence}</dd>
        <dt>Pending</dt><dd>{pending}</dd>
        <dt>Size</dt><dd>{buffer.width} x {buffer.height}</dd>
        <dt>Memory</dt><dd>{(approximateMemoryUsage() / 1024).toFixed(1)} KB</dd>
      </dl>
    </aside>
  );
}
