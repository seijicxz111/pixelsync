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
    <aside className="absolute bottom-4 left-4 z-30 rounded-2xl bg-slate-950/[0.88] p-3 text-xs text-white shadow-2xl shadow-black/[0.35] ring-1 ring-white/10 backdrop-blur-xl">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt>FPS</dt><dd className="text-right font-medium text-white">{fps}</dd>
        <dt>Latency</dt><dd className="text-right font-medium text-white">{latencyMs} ms</dd>
        <dt>Users</dt><dd className="text-right font-medium text-white">{connectedUsers}</dd>
        <dt>Sequence</dt><dd className="text-right font-medium text-white">{sequence}</dd>
        <dt>Pending</dt><dd className="text-right font-medium text-white">{pending}</dd>
        <dt>Size</dt><dd className="text-right font-medium text-white">{buffer.width} x {buffer.height}</dd>
        <dt>Memory</dt><dd className="text-right font-medium text-white">{(approximateMemoryUsage() / 1024).toFixed(1)} KB</dd>
      </dl>
    </aside>
  );
}
