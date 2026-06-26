"use client";

import { create } from "zustand";
import {
  applyPixelChanges,
  canvasMemoryBytes,
  clonePixelBuffer,
  createPixelBuffer,
  decodeSnapshot,
  extractPalette,
  type PixelBuffer,
  type PixelChange,
  type PixelTool,
  TRANSPARENT,
  type SnapshotEncoding,
  type ViewTransform
} from "@pixelsync/shared";

export type EditorStore = {
  buffer: PixelBuffer;
  revision: number;
  tool: PixelTool;
  foregroundColor: number;
  backgroundColor: number;
  recentColors: number[];
  projectPalette: number[];
  gridVisible: boolean;
  transform: ViewTransform;
  lastConfirmedSequence: number;
  pendingOperationIds: string[];
  connectedUsers: number;
  fps: number;
  latencyMs: number;
  history: Uint32Array[];
  future: Uint32Array[];
  setSnapshot: (snapshot: SnapshotEncoding, sequenceNumber: number) => void;
  setTool: (tool: PixelTool) => void;
  setForegroundColor: (color: number) => void;
  setBackgroundColor: (color: number) => void;
  swapColors: () => void;
  toggleGrid: () => void;
  setTransform: (transform: ViewTransform) => void;
  captureHistory: () => void;
  applyChanges: (changes: readonly PixelChange[]) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  setSequence: (sequence: number) => void;
  addPendingOperation: (operationId: string) => void;
  acknowledgeOperation: (operationId: string) => void;
  setConnectedUsers: (count: number) => void;
  setFps: (fps: number) => void;
  setLatency: (latencyMs: number) => void;
  replaceBuffer: (buffer: PixelBuffer) => void;
};

const defaultBuffer = createPixelBuffer(32, 32);

export const useEditorStore = create<EditorStore>((set, get) => ({
  buffer: defaultBuffer,
  revision: 0,
  tool: "PENCIL",
  foregroundColor: 0x22d3eeff,
  backgroundColor: TRANSPARENT,
  recentColors: [0x22d3eeff, 0xf472b6ff, 0xfacc15ff, 0xf8fafcff, 0x0f172aff],
  projectPalette: [],
  gridVisible: true,
  transform: { offsetX: 120, offsetY: 80, zoom: 16 },
  lastConfirmedSequence: 0,
  pendingOperationIds: [],
  connectedUsers: 1,
  fps: 0,
  latencyMs: 0,
  history: [],
  future: [],
  setSnapshot(snapshot, sequenceNumber) {
    const buffer = decodeSnapshot(snapshot);
    set({
      buffer,
      revision: get().revision + 1,
      lastConfirmedSequence: sequenceNumber,
      projectPalette: extractPalette(buffer),
      history: [],
      future: []
    });
  },
  setTool(tool) {
    set({ tool });
  },
  setForegroundColor(color) {
    const recentColors = [color, ...get().recentColors.filter((item) => item !== color)].slice(0, 12);
    set({ foregroundColor: color, recentColors });
  },
  setBackgroundColor(color) {
    set({ backgroundColor: color });
  },
  swapColors() {
    const { foregroundColor, backgroundColor } = get();
    set({ foregroundColor: backgroundColor, backgroundColor: foregroundColor });
  },
  toggleGrid() {
    set({ gridVisible: !get().gridVisible });
  },
  setTransform(transform) {
    set({ transform });
  },
  captureHistory() {
    const { buffer, history } = get();
    set({ history: [...history.slice(-39), new Uint32Array(buffer.pixels)], future: [] });
  },
  applyChanges(changes) {
    const { buffer } = get();
    applyPixelChanges(buffer, changes);
    set({ buffer, revision: get().revision + 1, projectPalette: extractPalette(buffer) });
  },
  clear() {
    const { buffer } = get();
    get().captureHistory();
    buffer.pixels.fill(TRANSPARENT);
    set({ buffer, revision: get().revision + 1 });
  },
  undo() {
    const { buffer, history, future } = get();
    const previous = history.at(-1);
    if (previous === undefined) {
      return;
    }

    set({
      buffer: { ...buffer, pixels: new Uint32Array(previous) },
      history: history.slice(0, -1),
      future: [new Uint32Array(buffer.pixels), ...future].slice(0, 40),
      revision: get().revision + 1
    });
  },
  redo() {
    const { buffer, history, future } = get();
    const next = future[0];
    if (next === undefined) {
      return;
    }

    set({
      buffer: { ...buffer, pixels: new Uint32Array(next) },
      history: [...history, new Uint32Array(buffer.pixels)].slice(-40),
      future: future.slice(1),
      revision: get().revision + 1
    });
  },
  setSequence(sequence) {
    set({ lastConfirmedSequence: sequence });
  },
  addPendingOperation(operationId) {
    set({ pendingOperationIds: [...get().pendingOperationIds, operationId] });
  },
  acknowledgeOperation(operationId) {
    set({ pendingOperationIds: get().pendingOperationIds.filter((id) => id !== operationId) });
  },
  setConnectedUsers(count) {
    set({ connectedUsers: count });
  },
  setFps(fps) {
    set({ fps });
  },
  setLatency(latencyMs) {
    set({ latencyMs });
  },
  replaceBuffer(buffer) {
    set({
      buffer: clonePixelBuffer(buffer),
      revision: get().revision + 1,
      projectPalette: extractPalette(buffer)
    });
  }
}));

export function approximateMemoryUsage(): number {
  return canvasMemoryBytes(useEditorStore.getState().buffer);
}
