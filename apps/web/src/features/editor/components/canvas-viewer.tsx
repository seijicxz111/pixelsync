"use client";

import { useEffect, useRef } from "react";
import { decodeSnapshot, typedArrayToImageData, type SnapshotEncoding } from "@pixelsync/shared";

export function CanvasViewer({ snapshot, name }: { snapshot: SnapshotEncoding; name: string }): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (canvas === null || canvas === undefined || context === null || context === undefined) {
      return;
    }

    const buffer = decodeSnapshot(snapshot);
    canvas.width = buffer.width;
    canvas.height = buffer.height;
    context.imageSmoothingEnabled = false;
    context.putImageData(typedArrayToImageData(buffer), 0, 0);
  }, [snapshot]);

  return (
    <canvas
      ref={ref}
      aria-label={name}
      className="aspect-square w-full rounded border border-white/10 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:16px_16px]"
    />
  );
}
