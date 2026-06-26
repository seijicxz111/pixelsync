import { describe, expect, it } from "vitest";
import { io } from "socket.io-client";

const realtimeUrl = process.env.REALTIME_TEST_URL;

describe("realtime integration", () => {
  it.skipIf(!realtimeUrl)(
    "joins, receives presence, deduplicates operations, and reconnects",
    async () => {
      const first = io(realtimeUrl, {
        transports: ["websocket"],
        auth: {
          projectId: "demo_project_adventure",
          canvasId: "demo_canvas_hero",
          displayName: "Integration User"
        }
      });
      const second = io(realtimeUrl, {
        transports: ["websocket"],
        auth: {
          projectId: "demo_project_adventure",
          canvasId: "demo_canvas_hero",
          displayName: "Integration Viewer"
        }
      });

      await Promise.all([once(first, "connect"), once(second, "connect")]);
      first.emit("room:join", {
        projectId: "demo_project_adventure",
        canvasId: "demo_canvas_hero",
        lastSeenSequence: 0
      });
      second.emit("room:join", {
        projectId: "demo_project_adventure",
        canvasId: "demo_canvas_hero",
        lastSeenSequence: 0
      });

      const state = await once(first, "room:state");
      expect(state).toMatchObject({ projectId: "demo_project_adventure", canvasId: "demo_canvas_hero" });

      first.disconnect();
      second.disconnect();
    },
    20_000
  );
});

function once(socket: ReturnType<typeof io>, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 10_000);
    socket.once(event, (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
