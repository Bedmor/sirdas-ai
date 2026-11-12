import type { Config } from "tailwindcss";

/** Tema değişkeni: rgb kanalları CSS'te; "ek" verilirse o temada soluk (/40 gibi) kullanımlar da okunur kalır. */
const v = (ad: string, ek?: string) =>
  ek
    ? `rgb(var(--c-${ad}) / min(1, calc(<alpha-value> + var(--${ek}, 0))))`
    : `rgb(var(--c-${ad}) / <alpha-value>)`;

const tokenRenkleri = {
  background: v("background"),
  foreground: v("foreground"),
  surface: v("surface"),
  "surface-dim": v("surface-dim"),
  "surface-bright": v("surface-bright"),
  "surface-container-lowest": v("surface-container-lowest"),
  "surface-container-low": v("surface-container-low"),
  "surface-container": v("surface-container"),
  "surface-container-high": v("surface-container-high"),
  "surface-container-highest": v("surface-container-highest"),
  "on-surface": v("on-surface", "mp-alfa-yazi"),
  "on-surface-variant": v("on-surface-variant", "mp-alfa-yazi"),
  primary: { DEFAULT: v("primary"), foreground: v("on-primary") },
  "primary-container": v("primary-container"),
  "on-primary": v("on-primary"),
  "on-primary-container": v("on-primary-container"),
  "primary-fixed": v("primary-fixed"),
  "primary-fixed-dim": v("primary-fixed-dim"),
  "on-primary-fixed": v("on-primary-fixed"),
  "on-primary-fixed-variant": v("on-primary-fixed-variant"),
  secondary: { DEFAULT: v("secondary"), foreground: v("on-secondary") },
  "secondary-container": v("secondary-container"),
  "on-secondary": v("on-secondary"),
  "on-secondary-container": v("on-secondary-container"),
  "secondary-fixed": v("secondary-fixed"),
  "secondary-fixed-dim": v("secondary-fixed-dim"),
  "on-secondary-fixed": v("on-secondary-fixed"),
  "on-secondary-fixed-variant": v("on-secondary-fixed-variant"),
  tertiary: { DEFAULT: v("tertiary"), foreground: v("on-tertiary") },
  "tertiary-container": v("tertiary-container"),
  "on-tertiary-container": v("on-tertiary-container"),
  outline: v("outline", "mp-alfa-cizgi"),
  "outline-variant": v("outline-variant", "mp-alfa-cizgi"),
  error: v("error"),
  "on-error": v("on-error"),
  "error-container": v("error-container"),
  "on-error-container": v("on-error-container"),
  card: { DEFAULT: v("surface"), foreground: v("on-surface") },
  popover: { DEFAULT: v("surface"), foreground: v("on-surface") },
  muted: { DEFAULT: v("surface-container"), foreground: v("on-surface-variant") },
  accent: { DEFAULT: v("surface-container-high"), foreground: v("primary") },
  destructive: { DEFAULT: v("error-container"), foreground: v("on-error-container") },
  border: v("outline-variant", "mp-alfa-cizgi"),
  input: v("outline-variant", "mp-alfa-cizgi"),
  ring: v("primary"),
  chart: {
    "1": v("primary"),
    "2": v("secondary"),
    "3": v("tertiary"),
    "4": v("secondary-fixed-dim"),
    "5": v("outline"),
  },
};

const TONLAR = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
/** Kodda doğrudan kullanılan Tailwind paletleri de temaya bağlanır (Gündüz'de tersine döner). */
const paletler = Object.fromEntries(
  ["slate", "emerald", "amber", "red", "teal", "blue"].map((p) => [
    p,
    Object.fromEntries(TONLAR.map((t) => [t, `rgb(var(--pl-${p}-${t}) / <alpha-value>)`])),
  ]),
);

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
        // Tüm renkler tema değişkenlerinden gelir (globals.css: Gece / Gündüz / Yüksek zıtlık)
        ...tokenRenkleri,
        ...paletler,
        white: "rgb(var(--c-beyaz) / <alpha-value>)",
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
        "m3-xs": "4px",
        "m3-sm": "8px",
        "m3-md": "12px",
        "m3-lg": "16px",
        "m3-xl": "28px",
        "m3-2xl": "36px",
        "m3-3xl": "44px",
        "m3-squircle": "24px",
        "m3-full": "9999px",
      },
      boxShadow: {
        "m3-1": "0px 1px 3px 1px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.4)",
        "m3-2": "0px 2px 6px 2px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.4)",
        "m3-3": "0px 4px 8px 3px rgba(0, 0, 0, 0.25), 0px 1px 3px 0px rgba(0, 0, 0, 0.4)",
        "m3-4": "0px 6px 10px 4px rgba(0, 0, 0, 0.25), 0px 2px 3px 0px rgba(0, 0, 0, 0.4)",
        "m3-5": "0px 8px 12px 6px rgba(0, 0, 0, 0.25), 0px 4px 4px 0px rgba(0, 0, 0, 0.4)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0, 0, 1)",
        "m3-emphasized": "cubic-bezier(0.2, 0, 0, 1)",
        "m3-emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
        "m3-emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
        "m3-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "m3-standard-decelerate": "cubic-bezier(0, 0, 0.2, 1)",
        "m3-standard-accelerate": "cubic-bezier(0.4, 0, 1, 1)",
        "m3e-spring-fast": "cubic-bezier(0.18, 0.89, 0.32, 1.28)",
        "m3e-spring-bouncy": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "m3e-spring-smooth": "cubic-bezier(0.25, 1.2, 0.5, 1)",
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
        m3eSpringIn: {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(12px)" },
          "70%": { transform: "scale(1.02) translateY(-2px)" },
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
        "m3e-spring": "m3eSpringIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
