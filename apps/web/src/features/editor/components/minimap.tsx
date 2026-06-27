"use client";

import { useEffect, useRef } from "react";
import { typedArrayToImageData } from "@pixelsync/shared";
import { useEditorStore } from "../store/use-editor-store";

export function Minimap(): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const buffer = useEditorStore((state) => state.buffer);
  const revision = useEditorStore((state) => state.revision);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (canvas === null || canvas === undefined || context === null || context === undefined) {
      return;
    }

    canvas.width = buffer.width;
    canvas.height = buffer.height;
    context.imageSmoothingEnabled = false;
    context.putImageData(typedArrayToImageData(buffer), 0, 0);
  }, [buffer, revision]);

  return (
    <div className="absolute bottom-4 right-4 z-30 rounded-2xl border border-white/10 bg-slate-950/[0.88] p-2 shadow-2xl shadow-black/[0.35] backdrop-blur-xl">
      <canvas ref={ref} aria-label="Canvas minimap" className="h-28 w-28 rounded-xl object-contain" />
    </div>
  );
}
