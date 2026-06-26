"use client";

import { ArrowLeftRight, Download } from "lucide-react";
import { colorToHex, parseHexColor } from "@pixelsync/shared";
import { Button, Input, Label, Tooltip } from "@pixelsync/ui";
import { downloadBlob, exportPixelBufferAsPng } from "../lib/export-png";
import { useEditorStore } from "../store/use-editor-store";

const presetColors = ["#0f172aff", "#ffffffff", "#22d3eeff", "#f472b6ff", "#facc15ff", "#a7f3d0ff", "#fb7185ff", "#00000000"];

export function ColorPanel({ canvasName }: { canvasName: string }): JSX.Element {
  const buffer = useEditorStore((state) => state.buffer);
  const foregroundColor = useEditorStore((state) => state.foregroundColor);
  const backgroundColor = useEditorStore((state) => state.backgroundColor);
  const recentColors = useEditorStore((state) => state.recentColors);
  const projectPalette = useEditorStore((state) => state.projectPalette);
  const setForegroundColor = useEditorStore((state) => state.setForegroundColor);
  const setBackgroundColor = useEditorStore((state) => state.setBackgroundColor);
  const swapColors = useEditorStore((state) => state.swapColors);

  async function exportPng(scale: number): Promise<void> {
    const blob = await exportPixelBufferAsPng(buffer, scale);
    downloadBlob(blob, `${canvasName.replaceAll(" ", "-").toLowerCase()}-${scale}x.png`);
  }

  return (
    <section className="border-l border-white/10 bg-slate-950 p-4 lg:w-80">
      <div className="mb-5 flex items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="foreground" className="text-white">Foreground</Label>
          <Input
            id="foreground"
            value={colorToHex(foregroundColor)}
            onChange={(event) => {
              try {
                setForegroundColor(parseHexColor(event.target.value));
              } catch {
                return;
              }
            }}
          />
        </div>
        <Tooltip label="Swap colors">
          <Button aria-label="Swap foreground and background colors" size="icon" onClick={swapColors}>
            <ArrowLeftRight size={18} aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          aria-label="Foreground color"
          className="h-14 rounded border border-white/10"
          style={{ backgroundColor: colorToHex(foregroundColor) }}
          onClick={() => setForegroundColor(backgroundColor)}
        />
        <button
          aria-label="Background color"
          className="h-14 rounded border border-white/10"
          style={{ backgroundColor: colorToHex(backgroundColor) }}
          onClick={() => setBackgroundColor(foregroundColor)}
        />
      </div>

      <Palette title="Presets" colors={presetColors.map(parseHexColor)} onSelect={setForegroundColor} />
      <Palette title="Recent" colors={recentColors} onSelect={setForegroundColor} />
      <Palette title="Extracted" colors={projectPalette} onSelect={setForegroundColor} />

      <div className="mt-6 space-y-2">
        <Label className="text-white">Export PNG</Label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 4].map((scale) => (
            <Button key={scale} variant="secondary" onClick={() => void exportPng(scale)}>
              <Download size={15} aria-hidden="true" />
              {scale}x
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Palette({
  title,
  colors,
  onSelect
}: {
  title: string;
  colors: number[];
  onSelect: (color: number) => void;
}): JSX.Element | null {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="grid grid-cols-8 gap-2">
        {colors.map((color) => (
          <button
            key={`${title}-${color}`}
            aria-label={`Select ${colorToHex(color)}`}
            className="aspect-square rounded border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            style={{ backgroundColor: colorToHex(color) }}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
    </div>
  );
}
