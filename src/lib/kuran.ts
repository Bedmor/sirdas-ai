import fs from "node:fs";
import path from "node:path";
import sureListesi from "./kuran-sureler.json";

/**
 * Kur'an-ı Kerim bölümü verisi.
 * Arapça metin: Tanzil Projesi (Osmanlı imlası). Meal: Elmalılı Muhammed Hamdi Yazır.
 * Kaynak dosyalar: public/kuran/NNN.json (kurandersleri.net arşivinden, 17.11.2026).
 */
export interface SureOzeti {
  no: number;
  ad: string;
  arapcaAd: string;
  yer: "Mekke" | "Medine";
  ayetSayisi: number;
}

export interface Ayet {
  n: number;
  ar: string;
  tr: string;
}

export interface Sure extends SureOzeti {
  besmele: boolean;
  ayetler: Ayet[];
}

export const SURELER = sureListesi as SureOzeti[];

export const BESMELE_AR = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export function sureOku(no: number): Sure | null {
  if (!Number.isInteger(no) || no < 1 || no > 114) return null;
  const dosya = path.join(process.cwd(), "public", "kuran", `${String(no).padStart(3, "0")}.json`);
  try {
    return JSON.parse(fs.readFileSync(dosya, "utf8")) as Sure;
  } catch {
    return null;
  }
}
