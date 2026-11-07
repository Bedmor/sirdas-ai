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
        arabic: [
          "var(--font-amiri)",
          "var(--font-noto-arabic)",
          "Amiri",
          "Noto Naskh Arabic",
          "Traditional Arabic",
          "Scheherazade New",
          "serif",
        ],
        quran: [
          "var(--font-amiri)",
          "var(--font-noto-arabic)",
          "Amiri",
          "Noto Naskh Arabic",
          "Traditional Arabic",
          "Scheherazade New",
          "serif",
        ],
        sans: ["var(--font-sans)", "Space Grotesk", "system-ui", "sans-serif"],
        serif: ["var(--font-heading)", "Roboto Slab", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
        fluid: "cubic-bezier(0.25, 1, 0.5, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.15)",
        apple: "cubic-bezier(0.32, 0.72, 0, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        DEFAULT: "250ms",
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
      },
      keyframes: {
        smoothFadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        smoothScaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        smoothSlideDown: {
          "0%": { opacity: "0", transform: "translateY(-16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        smoothBackdropFade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "smooth-fade": "smoothFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "smooth-scale": "smoothScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "smooth-slide": "smoothSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
