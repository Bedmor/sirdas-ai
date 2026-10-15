import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";
import { calculateContrastRatio } from "../harness/utils";

describe("Tier 1: Feature Coverage — UI & Visual Transformation", { tier: 1, feature: "UI" }, () => {
  const rootDir = process.cwd();

  it("T1-UI.1: Root layout enforces dark theme mode and proper font classes", () => {
    const layoutPath = path.join(rootDir, "src/app/layout.tsx");
    expect(fs.existsSync(layoutPath)).toBe(true);

    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain('className="dark"');
    expect(layoutContent).toContain("font-sans");
  });

  it("T1-UI.2: Theme design tokens define deep emerald, matte gold, and charcoal palette", () => {
    const cssPath = path.join(rootDir, "src/app/globals.css");
    expect(fs.existsSync(cssPath)).toBe(true);

    const cssContent = fs.readFileSync(cssPath, "utf-8");
    // Emerald: 160 hue
    expect(cssContent).toContain("--primary: 160");
    // Gold/Amber: matches --secondary definition
    expect(cssContent).toContain("--secondary:");
    // Charcoal Dark Ground: 224 hue, ~8% lightness
    expect(cssContent).toContain("--background: 224 30% 8%");
    expect(cssContent).toContain(".dark");
  });

  it("T1-UI.3: Hero section features contemplative headline, top shield badge, and statistics", () => {
    const heroPath = path.join(rootDir, "src/components/landing/hero.tsx");
    expect(fs.existsSync(heroPath)).toBe(true);

    const heroContent = fs.readFileSync(heroPath, "utf-8");
    expect(heroContent).toContain("Gönül Yaralarına");
    expect(heroContent).toContain("ShieldCheck");
    expect(heroContent).toContain("Fetva Vermez");
    expect(heroContent).toContain("Manevi Ayna");
  });

  it("T1-UI.4: Live WhatsApp CTA provides direct wa.me link with pulsing effect and active scale", () => {
    const heroPath = path.join(rootDir, "src/components/landing/hero.tsx");
    const heroContent = fs.readFileSync(heroPath, "utf-8");

    expect(heroContent).toContain("wa.me");
    expect(heroContent).toContain("active:scale-[0.98]");
    expect(heroContent).toContain("animate-ping");
  });

  it("T1-UI.5: 5 Spiritual Filters and Siyer Mührü cards are comprehensively visualized", () => {
    const manifestoPath = path.join(rootDir, "src/components/landing/manifesto.tsx");
    expect(fs.existsSync(manifestoPath)).toBe(true);

    const manifestoContent = fs.readFileSync(manifestoPath, "utf-8");
    expect(manifestoContent).toContain("Murakabe");
    expect(manifestoContent).toContain("İlahi Rıza");
    expect(manifestoContent).toContain("Tevekkül");
    expect(manifestoContent).toContain("Talâk 2-3");
    expect(manifestoContent).toContain("İmtihan");
    expect(manifestoContent).toContain("Siyer ve Ashab Mührü");
  });

  it("T1-UI.6: Religious and legal disclaimer banner is globally rendered in layout", () => {
    const disclaimerPath = path.join(rootDir, "src/components/layout/DisclaimerBanner.tsx");
    expect(fs.existsSync(disclaimerPath)).toBe(true);

    const disclaimerContent = fs.readFileSync(disclaimerPath, "utf-8");
    expect(disclaimerContent).toContain("Alo 190");
    expect(disclaimerContent).toContain("112");
  });
});
