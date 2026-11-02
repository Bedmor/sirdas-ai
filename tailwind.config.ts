import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#040F0F",
        foreground: "#e1e9e8",
        surface: "#0a1c1e",
        "surface-container-lowest": "#061112",
        "surface-container-low": "#09181a",
        "surface-container": "#0e2224",
        "surface-container-high": "#132c2e",
        "surface-container-highest": "#1a383b",
        "on-surface": "#e1e9e8",
        "on-surface-variant": "#8b9ea0",
        primary: {
          DEFAULT: "#cca762",
          foreground: "#1b1406",
        },
        "primary-container": "#94763a",
        "on-primary": "#1b1406",
        "primary-fixed-dim": "#e5cca0",
        secondary: {
          DEFAULT: "#459b95",
          foreground: "#041c1a",
        },
        "secondary-container": "#123835",
        "on-secondary-container": "#a3ece5",
        outline: "#8a7852",
        "outline-variant": "#1d3336",
        "error-container": "#421417",
        "on-error": "#fca5a5",
        card: {
          DEFAULT: "#0a1c1e",
          foreground: "#e1e9e8",
        },
        popover: {
          DEFAULT: "#0a1c1e",
          foreground: "#e1e9e8",
        },
        muted: {
          DEFAULT: "#0e2224",
          foreground: "#8b9ea0",
        },
        accent: {
          DEFAULT: "#132c2e",
          foreground: "#cca762",
        },
        destructive: {
          DEFAULT: "#421417",
          foreground: "#fca5a5",
        },
        border: "#1d3336",
        input: "#1d3336",
        ring: "#cca762",
        chart: {
          "1": "#cca762",
          "2": "#459b95",
          "3": "#94763a",
          "4": "#56aca6",
          "5": "#8a7852",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Roboto Slab", "serif"],
        body: ["var(--font-sans)", "Space Grotesk", "sans-serif"],
        arabic: ["var(--font-amiri)", "Amiri", "serif"],
        sans: ["var(--font-sans)", "Space Grotesk", "system-ui", "sans-serif"],
        serif: ["var(--font-heading)", "Roboto Slab", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
