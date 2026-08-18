import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        ink: "#14213D",
        "ink-soft": "#4B5568",
        accent: "#0F8B8D",
        "accent-soft": "#E4F3F2",
        warn: "#C97A2B",
        "warn-soft": "#FBF0E4",
        line: "#E2E5EA",
        danger: "#B23B3B",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
