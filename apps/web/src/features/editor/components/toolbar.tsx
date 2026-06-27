"use client";

import {
  ALargeSmall,
  Brush,
  Eraser,
  FlipHorizontal2,
  Grid3X3,
  Hand,
  MousePointer2,
  PaintBucket,
  Pipette,
  Redo2,
  Slash,
  Square,
  Trash2,
  Undo2
} from "lucide-react";
import { type PixelTool } from "@pixelsync/shared";
import { Button, Tooltip } from "@pixelsync/ui";
import { useEditorStore } from "../store/use-editor-store";

const tools: { tool: PixelTool; label: string; Icon: typeof Brush }[] = [
  { tool: "PENCIL", label: "Pencil", Icon: Brush },
  { tool: "ERASER", label: "Eraser", Icon: Eraser },
  { tool: "FILL", label: "Fill bucket", Icon: PaintBucket },
  { tool: "EYEDROPPER", label: "Color picker", Icon: Pipette },
  { tool: "LINE", label: "Line", Icon: Slash },
  { tool: "RECTANGLE_OUTLINE", label: "Rectangle outline", Icon: Square },
  { tool: "RECTANGLE_FILLED", label: "Filled rectangle", Icon: ALargeSmall },
  { tool: "SELECT", label: "Selection", Icon: MousePointer2 },
  { tool: "MOVE", label: "Move selected pixels", Icon: FlipHorizontal2 },
  { tool: "PAN", label: "Pan", Icon: Hand }
];

export function Toolbar({ canEdit }: { canEdit: boolean }): JSX.Element {
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);
  const toggleGrid = useEditorStore((state) => state.toggleGrid);

  return (
    <aside className="relative z-30 flex gap-1 overflow-x-auto overflow-y-visible border-b border-white/10 bg-slate-950/95 p-2 shadow-lg shadow-black/20 lg:w-14 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
      {tools.map(({ tool: item, label, Icon }) => (
        <Tooltip key={item} label={label} side="right">
          <Button
            aria-label={label}
            aria-pressed={tool === item}
            className="shrink-0"
            size="icon"
            variant={tool === item ? "primary" : "ghost"}
            disabled={!canEdit && item !== "PAN"}
            onClick={() => setTool(item)}
          >
            <Icon size={18} aria-hidden="true" />
          </Button>
        </Tooltip>
      ))}
      <div className="mx-1 h-9 w-px bg-white/10 lg:mx-0 lg:my-1 lg:h-px lg:w-full" />
      <Tooltip label="Undo" side="right">
        <Button aria-label="Undo" className="shrink-0" size="icon" variant="ghost" disabled={!canEdit} onClick={() => window.dispatchEvent(new CustomEvent("pixelsync:undo"))}>
          <Undo2 size={18} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip label="Redo" side="right">
        <Button aria-label="Redo" className="shrink-0" size="icon" variant="ghost" disabled={!canEdit} onClick={() => window.dispatchEvent(new CustomEvent("pixelsync:redo"))}>
          <Redo2 size={18} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip label="Toggle grid" side="right">
        <Button aria-label="Toggle grid" className="shrink-0" size="icon" variant="ghost" onClick={toggleGrid}>
          <Grid3X3 size={18} aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip label="Clear canvas" side="right">
        <Button aria-label="Clear canvas" className="shrink-0" size="icon" variant="ghost" disabled={!canEdit} onClick={() => window.dispatchEvent(new CustomEvent("pixelsync:clear"))}>
          <Trash2 size={18} aria-hidden="true" />
        </Button>
      </Tooltip>
    </aside>
  );
}
