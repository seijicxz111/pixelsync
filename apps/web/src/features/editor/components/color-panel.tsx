"use client";

import { type CSSProperties, type PointerEvent } from "react";
import { ArrowLeftRight, Download } from "lucide-react";
import {
  colorToHex,
  hslToRgba,
  packRgba,
  parseHexColor,
  rgbaToHsl,
  unpackRgba,
  type Rgba
} from "@pixelsync/shared";
import { Button, Input, Label, Tooltip } from "@pixelsync/ui";
import { downloadBlob, exportPixelBufferAsPng } from "../lib/export-png";
import { useEditorStore } from "../store/use-editor-store";

const presetColors = ["#0f172aff", "#ffffffff", "#22d3eeff", "#f472b6ff", "#facc15ff", "#a7f3d0ff", "#fb7185ff", "#00000000"];
const exportScales = [
  { scale: 1, label: "Original", detail: "1x" },
  { scale: 2, label: "Large", detail: "2x" },
  { scale: 4, label: "Sprite sheet", detail: "4x" }
];
const checkerBackground: CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgba(255,255,255,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.12) 75%)",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
  backgroundSize: "12px 12px"
};

export function ColorPanel({ canvasName }: { canvasName: string }): JSX.Element {
  const buffer = useEditorStore((state) => state.buffer);
  const foregroundColor = useEditorStore((state) => state.foregroundColor);
  const backgroundColor = useEditorStore((state) => state.backgroundColor);
  const recentColors = useEditorStore((state) => state.recentColors);
  const projectPalette = useEditorStore((state) => state.projectPalette);
  const setForegroundColor = useEditorStore((state) => state.setForegroundColor);
  const setBackgroundColor = useEditorStore((state) => state.setBackgroundColor);
  const swapColors = useEditorStore((state) => state.swapColors);
  const foregroundRgba = unpackRgba(foregroundColor);
  const foregroundHsl = rgbaToHsl(foregroundRgba);
  const wheelMarker = getWheelMarker(foregroundHsl.h, foregroundHsl.s);

  async function exportPng(scale: number): Promise<void> {
    const blob = await exportPixelBufferAsPng(buffer, scale);
    downloadBlob(blob, `${canvasName.replaceAll(" ", "-").toLowerCase()}-${scale}x.png`);
  }

  function updateForegroundRgba(next: Partial<Rgba>): void {
    setForegroundColor(packRgba({ ...foregroundRgba, ...next }));
  }

  function updateForegroundHsl(next: Partial<{ h: number; s: number; l: number; a: number }>): void {
    setForegroundColor(
      packRgba(
        hslToRgba({
          h: foregroundHsl.h,
          s: foregroundHsl.s,
          l: foregroundHsl.l,
          a: foregroundHsl.a,
          ...next
        })
      )
    );
  }

  function updateFromNativePicker(value: string): void {
    const next = unpackRgba(parseHexColor(value));
    setForegroundColor(packRgba({ ...next, a: foregroundRgba.a }));
  }

  function updateFromWheel(event: PointerEvent<HTMLButtonElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - rect.left - radius;
    const dy = event.clientY - rect.top - radius;
    const distance = Math.min(radius, Math.hypot(dx, dy));
    const hue = (Math.atan2(dy, dx) * 180) / Math.PI;
    const lightness = foregroundHsl.l <= 0.08 || foregroundHsl.l >= 0.92 ? 0.55 : foregroundHsl.l;

    updateForegroundHsl({
      h: hue < 0 ? hue + 360 : hue,
      s: distance / radius,
      l: lightness
    });
  }

  function handleWheelPointerDown(event: PointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromWheel(event);
  }

  function handleWheelPointerMove(event: PointerEvent<HTMLButtonElement>): void {
    if (event.buttons !== 1) {
      return;
    }

    event.preventDefault();
    updateFromWheel(event);
  }

  return (
    <section className="animate-[panel-in_180ms_ease-out] w-full shrink-0 overflow-y-auto border-l border-white/10 bg-slate-950/95 p-4 shadow-xl shadow-black/25 lg:w-96">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Color</h2>
            <p className="mt-1 text-xs text-slate-400">Foreground controls drawing; background is kept for quick swaps.</p>
          </div>
          <Tooltip label="Swap foreground and background colors" side="left">
            <Button aria-label="Swap foreground and background colors" size="icon" onClick={swapColors}>
              <ArrowLeftRight size={18} aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
          <div className="space-y-2">
            <Label htmlFor="foreground" className="text-white">Foreground</Label>
            <Input
              id="foreground"
              value={colorToHex(foregroundColor)}
              spellCheck={false}
              onChange={(event) => {
                try {
                  setForegroundColor(parseHexColor(event.target.value));
                } catch {
                  return;
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="native-color-picker" className="text-white">Picker</Label>
            <input
              id="native-color-picker"
              aria-label="Open system color picker"
              className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-white/5 p-1"
              type="color"
              value={colorToHex(foregroundColor, false)}
              onChange={(event) => updateFromNativePicker(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
          <ColorWheel
            markerX={wheelMarker.x}
            markerY={wheelMarker.y}
            onPointerDown={handleWheelPointerDown}
            onPointerMove={handleWheelPointerMove}
          />
          <div className="grid gap-3">
            <ColorChip label="FG" color={foregroundColor} active />
            <button
              type="button"
              className="group grid gap-1 text-left"
              onClick={() => setBackgroundColor(foregroundColor)}
            >
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400 group-hover:text-slate-200">BG</span>
              <span
                className="block h-12 w-14 rounded-xl border border-white/10"
                style={{ ...checkerBackground, backgroundColor: colorToHex(backgroundColor) }}
              />
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
          <div className="grid grid-cols-4 gap-2">
            <NumberField
              id="foreground-r"
              label="R"
              value={foregroundRgba.r}
              max={255}
              onChange={(value) => updateForegroundRgba({ r: value })}
            />
            <NumberField
              id="foreground-g"
              label="G"
              value={foregroundRgba.g}
              max={255}
              onChange={(value) => updateForegroundRgba({ g: value })}
            />
            <NumberField
              id="foreground-b"
              label="B"
              value={foregroundRgba.b}
              max={255}
              onChange={(value) => updateForegroundRgba({ b: value })}
            />
            <NumberField
              id="foreground-a"
              label="A"
              value={foregroundRgba.a}
              max={255}
              onChange={(value) => updateForegroundRgba({ a: value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              id="foreground-h"
              label="H"
              value={Math.round(foregroundHsl.h)}
              max={360}
              onChange={(value) => updateForegroundHsl({ h: value })}
            />
            <NumberField
              id="foreground-s"
              label="S%"
              value={Math.round(foregroundHsl.s * 100)}
              max={100}
              onChange={(value) => updateForegroundHsl({ s: value / 100 })}
            />
            <NumberField
              id="foreground-l"
              label="L%"
              value={Math.round(foregroundHsl.l * 100)}
              max={100}
              onChange={(value) => updateForegroundHsl({ l: value / 100 })}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
          <Label htmlFor="foreground-alpha" className="text-white">Alpha</Label>
          <Input
            id="foreground-alpha"
            className="mt-2 p-0 accent-cyan-300"
            type="range"
            min={0}
            max={255}
            value={foregroundRgba.a}
            onChange={(event) => updateForegroundRgba({ a: clampInteger(event.target.value, 0, 255) })}
          />
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
          <Palette title="Presets" colors={presetColors.map(parseHexColor)} onSelect={setForegroundColor} />
          <Palette title="Recent" colors={recentColors} onSelect={setForegroundColor} />
          <Palette title="Extracted" colors={projectPalette} onSelect={setForegroundColor} />
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm shadow-black/20">
          <div>
            <Label className="text-white">Export PNG</Label>
            <p className="mt-1 text-xs text-slate-400">1x keeps the canvas resolution; 2x and 4x enlarge it with crisp nearest-neighbor pixels.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {exportScales.map(({ scale, label, detail }) => (
              <Button key={scale} className="h-auto flex-col gap-1 py-2" variant="secondary" onClick={() => void exportPng(scale)}>
                <span className="flex items-center gap-1 text-xs">
                  <Download size={14} aria-hidden="true" />
                  {detail}
                </span>
                <span className="text-[0.68rem] font-medium text-slate-300">{label}</span>
              </Button>
            ))}
          </div>
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
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="grid grid-cols-8 gap-2">
        {colors.map((color) => (
          <button
            key={`${title}-${color}`}
            aria-label={`Select ${colorToHex(color)}`}
            className="aspect-square rounded-xl border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            style={{ ...checkerBackground, backgroundColor: colorToHex(color) }}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
    </div>
  );
}

function ColorWheel({
  markerX,
  markerY,
  onPointerDown,
  onPointerMove
}: {
  markerX: number;
  markerY: number;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label="Choose foreground color from color wheel"
      className="relative mx-auto size-44 rounded-full border border-white/15 shadow-inner shadow-slate-950/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
      style={{
        background:
          "radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 62%), conic-gradient(from 90deg, #ff3b30, #ffcc00, #34c759, #00c7be, #007aff, #af52de, #ff2d55, #ff3b30)"
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <span
        aria-hidden="true"
        className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_2px_8px_rgba(0,0,0,0.55)]"
        style={{ left: `${markerX}%`, top: `${markerY}%` }}
      />
    </button>
  );
}

function ColorChip({ label, color, active }: { label: string; color: number; active?: boolean }): JSX.Element {
  return (
    <div className="grid gap-1">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span
        className="block h-12 w-14 rounded-xl border"
        style={{
          ...checkerBackground,
          backgroundColor: colorToHex(color),
          borderColor: active === true ? "rgb(103 232 249)" : "rgba(255,255,255,0.1)"
        }}
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  max,
  onChange
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}): JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-slate-300">{label}</Label>
      <Input
        id={id}
        className="h-9 px-2 text-xs"
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(clampInteger(event.target.value, 0, max))}
      />
    </div>
  );
}

function clampInteger(value: string, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return min;
  }

  return Math.min(max, Math.max(min, parsed));
}

function getWheelMarker(hue: number, saturation: number): { x: number; y: number } {
  const radius = Math.min(50, Math.max(0, saturation * 50));
  const radians = (hue * Math.PI) / 180;

  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius
  };
}
