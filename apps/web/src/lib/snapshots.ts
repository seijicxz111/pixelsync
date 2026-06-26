import { encodeSnapshot, createPixelBuffer } from "@pixelsync/shared";

export function createBlankSnapshot(width: number, height: number): string {
  return JSON.stringify(encodeSnapshot(createPixelBuffer(width, height)));
}
