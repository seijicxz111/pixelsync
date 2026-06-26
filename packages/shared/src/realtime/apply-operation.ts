import { applyPixelChanges, resizePixelBuffer } from "../pixel/encoding";
import { type PixelBuffer } from "../pixel/types";
import { type AcceptedCanvasOperation, type ClientCanvasOperation } from "./events";

export function applyCanvasOperation(
  buffer: PixelBuffer,
  operation: ClientCanvasOperation | AcceptedCanvasOperation
): PixelBuffer {
  if (operation.operationType === "PIXELS_SET") {
    applyPixelChanges(buffer, operation.payload.changes);
    return buffer;
  }

  if (operation.operationType === "CANVAS_CLEAR") {
    buffer.pixels.fill(operation.payload.color);
    return buffer;
  }

  return resizePixelBuffer(
    buffer,
    operation.payload.width,
    operation.payload.height,
    operation.payload.alignment,
    operation.payload.fill
  );
}
