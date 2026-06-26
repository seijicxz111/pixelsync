import { z } from "zod";

export const MAX_CANVAS_WIDTH = 512;
export const MAX_CANVAS_HEIGHT = 512;
export const MAX_CANVAS_PIXELS = 128 * 128 * 16;
export const TRANSPARENT = 0x00000000;

export const pixelToolSchema = z.enum([
  "PENCIL",
  "ERASER",
  "FILL",
  "EYEDROPPER",
  "LINE",
  "RECTANGLE_OUTLINE",
  "RECTANGLE_FILLED",
  "SELECT",
  "MOVE",
  "PAN"
]);

export const alignmentSchema = z.enum([
  "TOP_LEFT",
  "TOP",
  "TOP_RIGHT",
  "LEFT",
  "CENTER",
  "RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM",
  "BOTTOM_RIGHT"
]);

export const backgroundModeSchema = z.enum(["TRANSPARENT", "SOLID", "CHECKERBOARD"]);

export const rgbaColorSchema = z
  .number()
  .int()
  .min(0)
  .max(0xffffffff)
  .describe("RGBA packed as 0xRRGGBBAA");

export const coordinateSchema = z.object({
  x: z.number().int().min(0).max(MAX_CANVAS_WIDTH - 1),
  y: z.number().int().min(0).max(MAX_CANVAS_HEIGHT - 1)
});

export const pixelChangeSchema = coordinateSchema.extend({
  color: rgbaColorSchema
});

export const canvasDimensionsBaseSchema = z.object({
    width: z.number().int().min(1).max(MAX_CANVAS_WIDTH),
    height: z.number().int().min(1).max(MAX_CANVAS_HEIGHT)
  });

export const canvasDimensionsSchema = canvasDimensionsBaseSchema
  .refine((value) => value.width * value.height <= MAX_CANVAS_PIXELS, {
    message: `Canvas cannot exceed ${MAX_CANVAS_PIXELS} pixels`
  });

export type PixelTool = z.infer<typeof pixelToolSchema>;
export type Alignment = z.infer<typeof alignmentSchema>;
export type BackgroundMode = z.infer<typeof backgroundModeSchema>;
export type CanvasDimensions = z.infer<typeof canvasDimensionsSchema>;
export type Coordinate = z.infer<typeof coordinateSchema>;
export type PixelChange = z.infer<typeof pixelChangeSchema>;

export type PixelBuffer = {
  width: number;
  height: number;
  pixels: Uint32Array;
};

export type SnapshotEncoding = {
  format: "rgba-rle-v1";
  width: number;
  height: number;
  data: string;
};
