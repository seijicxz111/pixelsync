import { describe, expect, it } from "vitest";
import { createPixelBuffer, getPixel, packRgba } from "../pixel";
import { applyCanvasOperation } from "./apply-operation";

describe("applyCanvasOperation", () => {
  it("applies pixel set operations", () => {
    const red = packRgba({ r: 255, g: 0, b: 0, a: 255 });
    const buffer = createPixelBuffer(2, 2);

    applyCanvasOperation(buffer, {
      operationId: "00000000-0000-4000-8000-000000000100",
      projectId: "project_123",
      canvasId: "canvas_123",
      clientTimestamp: Date.now(),
      operationType: "PIXELS_SET",
      payload: { changes: [{ x: 1, y: 1, color: red }] }
    });

    expect(getPixel(buffer, 1, 1)).toBe(red);
  });
});
