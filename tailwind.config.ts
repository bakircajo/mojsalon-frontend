import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F4F0",
        ink: "#1C1B1F",
        stub: {
          DEFAULT: "#B5495B",
          dark: "#8C3548",
          light: "#F3DEE1",
        },
        pine: {
          DEFAULT: "#1F4E45",
          light: "#DCE9E4",
        },
        line: "#DFDCD3",
        muted: "#716F6A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "ticket-notch":
          "radial-gradient(circle at 0 50%, transparent 8px, #F5F4F0 8.5px), radial-gradient(circle at 100% 50%, transparent 8px, #F5F4F0 8.5px)",
      },
    },
  },
  plugins: [],
};
export default config;
