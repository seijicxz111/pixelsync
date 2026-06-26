import { describe, expect, it } from "vitest";
import {
  clientCanvasOperationSchema,
  clientToServerEvents,
  operationPayloadSize
} from "./events";

describe("realtime event schemas", () => {
  it("validates accepted client canvas operations", () => {
    const operation = clientCanvasOperationSchema.parse({
      operationId: "00000000-0000-4000-8000-000000000000",
      projectId: "project_123",
      canvasId: "canvas_123",
      clientTimestamp: Date.now(),
      operationType: "PIXELS_SET",
      payload: {
        changes: [{ x: 1, y: 2, color: 0xff0000ff }]
      }
    });

    expect(operationPayloadSize(operation)).toBe(1);
  });

  it("rejects malformed operations", () => {
    expect(() =>
      clientToServerEvents["canvas:operation"].parse({
        operationId: "not-a-uuid",
        projectId: "project_123",
        canvasId: "canvas_123",
        clientTimestamp: Date.now(),
        operationType: "PIXELS_SET",
        payload: {
          changes: [{ x: -1, y: 0, color: 0 }]
        }
      })
    ).toThrow();
  });
});
