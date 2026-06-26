import { describe, expect, it } from "vitest";
import { calculateFitZoom, screenToCanvasCoordinate, zoomAroundPointer } from "./geometry";

describe("pixel geometry", () => {
  it("converts screen coordinates through pan and zoom", () => {
    expect(screenToCanvasCoordinate({ x: 42, y: 26 }, { offsetX: 10, offsetY: 10, zoom: 8 })).toEqual({
      x: 4,
      y: 2
    });
  });

  it("fits zoom inside the viewport", () => {
    expect(calculateFitZoom({ width: 400, height: 300 }, { width: 32, height: 32 })).toBe(7);
  });

  it("zooms around the pointer without moving the pointed canvas coordinate", () => {
    const next = zoomAroundPointer({ offsetX: 0, offsetY: 0, zoom: 4 }, { x: 40, y: 40 }, 8);
    expect(screenToCanvasCoordinate({ x: 40, y: 40 }, next)).toEqual({ x: 10, y: 10 });
  });
});
