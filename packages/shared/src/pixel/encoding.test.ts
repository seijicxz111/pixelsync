import { describe, expect, it } from "vitest";
import { packRgba } from "./colors";
import {
  applyPixelChanges,
  canvasMemoryBytes,
  createPixelBuffer,
  decodeSnapshot,
  encodeSnapshot,
  getPixel,
  resizePixelBuffer
} from "./encoding";

describe("pixel encoding", () => {
  it("round-trips snapshots with RLE encoding", () => {
    const red = packRgba({ r: 255, g: 0, b: 0, a: 255 });
    const blue = packRgba({ r: 0, g: 0, b: 255, a: 255 });
    const buffer = createPixelBuffer(4, 4);
    applyPixelChanges(buffer, [
      { x: 0, y: 0, color: red },
      { x: 1, y: 0, color: red },
      { x: 3, y: 3, color: blue }
    ]);

    const decoded = decodeSnapshot(encodeSnapshot(buffer));
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(4);
    expect([...decoded.pixels]).toEqual([...buffer.pixels]);
  });

  it("resizes around the requested alignment", () => {
    const red = packRgba({ r: 255, g: 0, b: 0, a: 255 });
    const source = createPixelBuffer(2, 2);
    applyPixelChanges(source, [{ x: 0, y: 0, color: red }]);

    const resized = resizePixelBuffer(source, 4, 4, "CENTER");
    expect(getPixel(resized, 1, 1)).toBe(red);
  });

  it("reports typed-array memory usage", () => {
    expect(canvasMemoryBytes({ width: 16, height: 16 })).toBe(1024);
  });
});
