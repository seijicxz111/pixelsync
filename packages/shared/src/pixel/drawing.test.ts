import { describe, expect, it } from "vitest";
import { packRgba } from "./colors";
import { applyPixelChanges, createPixelBuffer, getPixel } from "./encoding";
import { extractPalette, floodFill, linePoints, rectanglePoints } from "./drawing";

describe("drawing algorithms", () => {
  it("draws diagonal lines with Bresenham points", () => {
    expect(linePoints({ x: 0, y: 0 }, { x: 3, y: 3 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 }
    ]);
  });

  it("draws rectangle outlines and filled rectangles", () => {
    expect(rectanglePoints({ x: 0, y: 0 }, { x: 2, y: 2 }, false)).toHaveLength(8);
    expect(rectanglePoints({ x: 0, y: 0 }, { x: 2, y: 2 }, true)).toHaveLength(9);
  });

  it("fills connected regions only", () => {
    const red = packRgba({ r: 255, g: 0, b: 0, a: 255 });
    const blue = packRgba({ r: 0, g: 0, b: 255, a: 255 });
    const buffer = createPixelBuffer(4, 4);
    applyPixelChanges(buffer, [
      { x: 1, y: 0, color: red },
      { x: 1, y: 1, color: red },
      { x: 1, y: 2, color: red },
      { x: 1, y: 3, color: red }
    ]);

    const changes = floodFill(buffer, { x: 0, y: 0 }, blue);
    applyPixelChanges(buffer, changes);

    expect(getPixel(buffer, 0, 0)).toBe(blue);
    expect(getPixel(buffer, 2, 0)).not.toBe(blue);
  });

  it("extracts common palette colors", () => {
    const red = packRgba({ r: 255, g: 0, b: 0, a: 255 });
    const blue = packRgba({ r: 0, g: 0, b: 255, a: 255 });
    const buffer = createPixelBuffer(3, 1);
    applyPixelChanges(buffer, [
      { x: 0, y: 0, color: red },
      { x: 1, y: 0, color: red },
      { x: 2, y: 0, color: blue }
    ]);

    expect(extractPalette(buffer, 2)).toEqual([red, blue]);
  });
});
