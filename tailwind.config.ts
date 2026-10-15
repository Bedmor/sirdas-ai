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
        background: "#080c0a",
        foreground: "#e1e7e3",
        surface: "#0d1410",
        "surface-container-lowest": "#060807",
        "surface-container-low": "#0d1410",
        "surface-container": "#121a15",
        "surface-container-high": "#19241e",
        "surface-container-highest": "#212f27",
        "on-surface": "#e1e7e3",
        "on-surface-variant": "#cbd5e1",
        primary: {
          DEFAULT: "#ffb77d",
          foreground: "#4d2600",
        },
        "primary-container": "#d97707",
        "on-primary": "#4d2600",
        "primary-fixed-dim": "#ffdcc3",
        secondary: {
          DEFAULT: "#4edea3",
          foreground: "#003824",
        },
        "secondary-container": "#00a572",
        "on-secondary-container": "#00311f",
        outline: "#a38c7c",
        "outline-variant": "#313633",
        "error-container": "#4a1215",
        "on-error": "#fca5a5",
        card: {
          DEFAULT: "#0d1410",
          foreground: "#e1e7e3",
        },
        popover: {
          DEFAULT: "#0d1410",
          foreground: "#e1e7e3",
        },
        muted: {
          DEFAULT: "#121a15",
          foreground: "#cbd5e1",
        },
        accent: {
          DEFAULT: "#19241e",
          foreground: "#4edea3",
        },
        destructive: {
          DEFAULT: "#4a1215",
          foreground: "#fca5a5",
        },
        border: "#313633",
        input: "#313633",
        ring: "#d97707",
        chart: {
          "1": "#4edea3",
          "2": "#ffb77d",
          "3": "#00a572",
          "4": "#d97707",
          "5": "#a38c7c",
        },
      },
      fontFamily: {
        heading: ["var(--font-titillium)", "Titillium Web", "sans-serif"],
        body: ["var(--font-sans)", "Plus Jakarta Sans", "sans-serif"],
        arabic: ["var(--font-amiri)", "Amiri", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        serif: ["var(--font-amiri)", "Amiri", "serif"],
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
