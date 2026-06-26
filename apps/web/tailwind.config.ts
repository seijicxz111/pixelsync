import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 0 36px rgba(34, 211, 238, 0.22)"
      },
      gridTemplateColumns: {
        16: "repeat(16, minmax(0, 1fr))"
      }
    }
  },
  plugins: []
};

export default config;
