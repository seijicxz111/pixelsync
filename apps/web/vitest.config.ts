import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "@pixelsync/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
      "@pixelsync/ui": new URL("../../packages/ui/src/index.ts", import.meta.url).pathname
    }
  }
});
