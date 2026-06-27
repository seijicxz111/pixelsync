"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  calculateFitZoom,
  canvasToScreenCoordinate,
  floodFill,
  getPixel,
  isInsideCanvas,
  linePoints,
  pencilStroke,
  rectanglePoints,
  screenToCanvasCoordinate,
  typedArrayToImageData,
  zoomAroundPointer,
  type ClientCanvasOperation,
  type Coordinate,
  type PixelChange,
  type PresenceUser
} from "@pixelsync/shared";
import { createSetPixelsOperation } from "../lib/operations";
import { useEditorStore } from "../store/use-editor-store";

export type CanvasStageProps = {
  projectId: string;
  canvasId: string;
  canEdit: boolean;
  remoteUsers: PresenceUser[];
  onOperation: (operation: ClientCanvasOperation) => void;
  onCursorMove: (coordinate: Coordinate) => void;
};

type DragState =
  | { mode: "DRAW"; start: Coordinate; last: Coordinate; changes: Map<string, PixelChange> }
  | { mode: "SHAPE"; start: Coordinate; last: Coordinate }
  | { mode: "PAN"; startX: number; startY: number; offsetX: number; offsetY: number };

type ShapePreview = {
  start: Coordinate;
  end: Coordinate;
  tool: "LINE" | "RECTANGLE_OUTLINE" | "RECTANGLE_FILLED";
  color: number;
};

export function CanvasStage({
  projectId,
  canvasId,
  canEdit,
  remoteUsers,
  onOperation,
  onCursorMove
}: CanvasStageProps): JSX.Element {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrame = useRef<number | null>(null);
  const dragState = useRef<DragState | null>(null);
  const userAdjustedView = useRef(false);
  const [viewport, setViewport] = useState({ width: 960, height: 640 });
  const [shapePreview, setShapePreview] = useState<ShapePreview | null>(null);
  const buffer = useEditorStore((state) => state.buffer);
  const revision = useEditorStore((state) => state.revision);
  const transform = useEditorStore((state) => state.transform);
  const gridVisible = useEditorStore((state) => state.gridVisible);
  const tool = useEditorStore((state) => state.tool);
  const foregroundColor = useEditorStore((state) => state.foregroundColor);
  const setForegroundColor = useEditorStore((state) => state.setForegroundColor);
  const setTransform = useEditorStore((state) => state.setTransform);
  const captureHistory = useEditorStore((state) => state.captureHistory);
  const applyChanges = useEditorStore((state) => state.applyChanges);
  const setFps = useEditorStore((state) => state.setFps);

  const remoteCursorNodes = useMemo(
    () =>
      remoteUsers
        .filter((user) => user.cursor !== null)
        .map((user) => {
          const cursor = user.cursor;
          if (cursor === null) {
            return null;
          }

          const position = canvasToScreenCoordinate(cursor, transform);
          return (
            <div
              key={user.userId}
              className="pointer-events-none absolute z-20 flex translate-x-1 translate-y-1 items-center gap-1"
              style={{ left: position.x, top: position.y }}
            >
              <span
                className="block size-3 rotate-45 border border-slate-950"
                style={{ backgroundColor: user.collaborationColor }}
              />
              <span className="rounded bg-slate-950 px-1.5 py-0.5 text-xs text-white ring-1 ring-white/10">
                {user.displayName}
              </span>
            </div>
          );
        }),
    [remoteUsers, transform]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
    canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, viewport.width, viewport.height);
    drawCheckerboard(context, viewport.width, viewport.height);

    const source = document.createElement("canvas");
    source.width = buffer.width;
    source.height = buffer.height;
    const sourceContext = source.getContext("2d");
    if (sourceContext === null) {
      return;
    }

    sourceContext.imageSmoothingEnabled = false;
    sourceContext.putImageData(typedArrayToImageData(buffer), 0, 0);
    context.drawImage(
      source,
      transform.offsetX,
      transform.offsetY,
      buffer.width * transform.zoom,
      buffer.height * transform.zoom
    );

    if (shapePreview !== null) {
      drawShapePreview(context, shapePreview, transform, buffer.width, buffer.height);
    }

    if (gridVisible && transform.zoom >= 6) {
      drawGrid(context, buffer.width, buffer.height, transform);
    }
  }, [buffer, gridVisible, shapePreview, transform, viewport]);

  useEffect(() => {
    const startedAt = performance.now();
    animationFrame.current = requestAnimationFrame(() => {
      render();
      const elapsed = performance.now() - startedAt;
      setFps(Math.round(1000 / Math.max(1, elapsed)));
    });

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [render, revision, setFps]);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }

      setViewport({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height)
      });
    });

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (userAdjustedView.current || viewport.width <= 0 || viewport.height <= 0) {
      return;
    }

    const zoom = calculateFitZoom(viewport, buffer, 56);
    setTransform({
      zoom,
      offsetX: Math.round((viewport.width - buffer.width * zoom) / 2),
      offsetY: Math.round((viewport.height - buffer.height * zoom) / 2)
    });
  }, [buffer.height, buffer.width, setTransform, viewport.height, viewport.width]);

  function toCanvasCoordinate(event: PointerEvent<HTMLCanvasElement> | WheelEvent<HTMLCanvasElement>): Coordinate {
    const rect = event.currentTarget.getBoundingClientRect();
    return screenToCanvasCoordinate(
      { x: Math.floor(event.clientX - rect.left), y: Math.floor(event.clientY - rect.top) },
      transform
    );
  }

  function sendChanges(changes: readonly PixelChange[]): void {
    if (changes.length === 0) {
      return;
    }

    const operation = createSetPixelsOperation({ projectId, canvasId, changes, clientRevision: revision });
    onOperation(operation);
  }

  function drawImmediate(point: Coordinate): void {
    if (!canEdit || !isInsideCanvas(buffer, point.x, point.y)) {
      return;
    }

    if (tool === "EYEDROPPER") {
      setForegroundColor(getPixel(buffer, point.x, point.y));
      return;
    }

    if (tool === "FILL") {
      captureHistory();
      const changes = floodFill(buffer, point, foregroundColor);
      applyChanges(changes);
      sendChanges(changes);
      return;
    }

    if (tool === "PENCIL" || tool === "ERASER") {
      captureHistory();
      const color = tool === "ERASER" ? 0 : foregroundColor;
      const changes = pencilStroke([point], color);
      applyChanges(changes);
      const map = new Map<string, PixelChange>(changes.map((change) => [`${change.x}:${change.y}`, change]));
      dragState.current = { mode: "DRAW", start: point, last: point, changes: map };
      return;
    }

    if (tool === "LINE" || tool === "RECTANGLE_OUTLINE" || tool === "RECTANGLE_FILLED") {
      dragState.current = { mode: "SHAPE", start: point, last: point };
      setShapePreview({ start: point, end: point, tool, color: foregroundColor });
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>): void {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "PAN" || event.button === 1 || event.altKey) {
      userAdjustedView.current = true;
      dragState.current = {
        mode: "PAN",
        startX: event.clientX,
        startY: event.clientY,
        offsetX: transform.offsetX,
        offsetY: transform.offsetY
      };
      return;
    }

    drawImmediate(toCanvasCoordinate(event));
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>): void {
    event.preventDefault();
    const point = toCanvasCoordinate(event);
    if (isInsideCanvas(buffer, point.x, point.y)) {
      onCursorMove(point);
    }
    const current = dragState.current;

    if (current === null) {
      return;
    }

    if (current.mode === "PAN") {
      setShapePreview(null);
      setTransform({
        ...transform,
        offsetX: current.offsetX + event.clientX - current.startX,
        offsetY: current.offsetY + event.clientY - current.startY
      });
      return;
    }

    if (!canEdit || !isInsideCanvas(buffer, point.x, point.y)) {
      return;
    }

    if (current.mode === "DRAW") {
      const color = tool === "ERASER" ? 0 : foregroundColor;
      const stroke = pencilStroke(linePoints(current.last, point), color);
      const unique = stroke.filter((change) => !current.changes.has(`${change.x}:${change.y}`));
      for (const change of unique) {
        current.changes.set(`${change.x}:${change.y}`, change);
      }
      current.last = point;
      applyChanges(unique);
      return;
    }

    current.last = point;
    if (current.mode === "SHAPE") {
      const previewTool =
        tool === "LINE" || tool === "RECTANGLE_OUTLINE" || tool === "RECTANGLE_FILLED" ? tool : "LINE";
      setShapePreview({ start: current.start, end: point, tool: previewTool, color: foregroundColor });
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>): void {
    event.preventDefault();
    const current = dragState.current;
    dragState.current = null;
    setShapePreview(null);

    if (current === null || current.mode === "PAN") {
      return;
    }

    if (current.mode === "DRAW") {
      sendChanges([...current.changes.values()]);
      return;
    }

    if (!canEdit) {
      return;
    }

    captureHistory();
    const end = toCanvasCoordinate(event);
    const points =
      tool === "LINE"
        ? linePoints(current.start, end)
        : rectanglePoints(current.start, end, tool === "RECTANGLE_FILLED");
    const changes = pencilStroke(points, foregroundColor);
    applyChanges(changes);
    sendChanges(changes);
  }

  function handleWheel(event: WheelEvent<HTMLCanvasElement>): void {
    event.preventDefault();
    userAdjustedView.current = true;
    const rect = event.currentTarget.getBoundingClientRect();
    const pointer = { x: Math.floor(event.clientX - rect.left), y: Math.floor(event.clientY - rect.top) };
    const direction = event.deltaY > 0 ? -1 : 1;
    setTransform(zoomAroundPointer(transform, pointer, transform.zoom + direction));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const actions: Record<string, () => void> = {
        b: () => useEditorStore.getState().setTool("PENCIL"),
        e: () => useEditorStore.getState().setTool("ERASER"),
        g: () => useEditorStore.getState().setTool("FILL"),
        i: () => useEditorStore.getState().setTool("EYEDROPPER"),
        h: () => useEditorStore.getState().setTool("PAN")
      };

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        useEditorStore.getState().undo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        useEditorStore.getState().redo();
        return;
      }

      const action = actions[event.key.toLowerCase()];
      if (action !== undefined) {
        action();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(135deg,#101827_0%,#111827_46%,#0b1220_100%)]">
      <canvas
        ref={canvasRef}
        aria-label="Pixel canvas"
        className="h-full w-full touch-none outline-none"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />
      {remoteCursorNodes}
      {!canEdit ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-slate-950/[0.88] px-3 py-2 text-sm text-slate-200 shadow-xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-xl">
          Read-only viewer
        </div>
      ) : null}
    </div>
  );
}

function drawShapePreview(
  context: CanvasRenderingContext2D,
  preview: ShapePreview,
  transform: { offsetX: number; offsetY: number; zoom: number },
  width: number,
  height: number
): void {
  const points =
    preview.tool === "LINE"
      ? linePoints(preview.start, preview.end)
      : rectanglePoints(preview.start, preview.end, preview.tool === "RECTANGLE_FILLED");
  const visiblePoints = points.filter((point) => point.x >= 0 && point.y >= 0 && point.x < width && point.y < height);

  context.save();
  context.globalAlpha = 0.78;
  context.fillStyle = colorToCanvasCss(preview.color);
  context.strokeStyle = "rgba(255,255,255,0.72)";
  context.lineWidth = 1;

  for (const point of visiblePoints) {
    context.fillRect(
      transform.offsetX + point.x * transform.zoom,
      transform.offsetY + point.y * transform.zoom,
      Math.max(1, transform.zoom),
      Math.max(1, transform.zoom)
    );
  }

  if (visiblePoints.length > 0 && transform.zoom >= 4) {
    context.beginPath();
    for (const point of visiblePoints) {
      context.rect(
        transform.offsetX + point.x * transform.zoom + 0.5,
        transform.offsetY + point.y * transform.zoom + 0.5,
        Math.max(1, transform.zoom) - 1,
        Math.max(1, transform.zoom) - 1
      );
    }
    context.stroke();
  }

  context.restore();
}

function colorToCanvasCss(color: number): string {
  const red = (color >>> 24) & 0xff;
  const green = (color >>> 16) & 0xff;
  const blue = (color >>> 8) & 0xff;
  const alpha = color & 0xff;

  return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
}

function drawCheckerboard(context: CanvasRenderingContext2D, width: number, height: number): void {
  const size = 18;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      context.fillStyle = (x / size + y / size) % 2 === 0 ? "#0f172a" : "#111827";
      context.fillRect(x, y, size, size);
    }
  }
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  transform: { offsetX: number; offsetY: number; zoom: number }
): void {
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 1;
  context.beginPath();

  for (let x = 0; x <= width; x += 1) {
    const screenX = transform.offsetX + x * transform.zoom;
    context.moveTo(screenX, transform.offsetY);
    context.lineTo(screenX, transform.offsetY + height * transform.zoom);
  }

  for (let y = 0; y <= height; y += 1) {
    const screenY = transform.offsetY + y * transform.zoom;
    context.moveTo(transform.offsetX, screenY);
    context.lineTo(transform.offsetX + width * transform.zoom, screenY);
  }

  context.stroke();
}
