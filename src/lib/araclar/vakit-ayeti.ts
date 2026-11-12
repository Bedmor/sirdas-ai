import veri from "@/data/vakit-ayetleri.json";

export type VakitAyeti = {
  anahtar: string;
  sure: string;
  sureNo: number;
  ayet: string;
  arapca: string;
  meal: string;
};

export type DilimAnahtari = "seher" | "sabah" | "kusluk" | "ikindi" | "aksam" | "gece";

export const DILIM_ADLARI: Record<DilimAnahtari, string> = {
  seher: "Seher vakti",
  sabah: "Sabah",
  kusluk: "Kuşluk",
  ikindi: "Öğle ve ikindi",
  aksam: "Akşam",
  gece: "Gece",
};

/** Saat (0-23) -> gün dilimi. Saatler yaklaşık sınırlardır. */
export function saattenDilim(saat: number): DilimAnahtari {
  if (saat >= 3 && saat < 6) return "seher";
  if (saat >= 6 && saat < 9) return "sabah";
  if (saat >= 9 && saat < 12) return "kusluk";
  if (saat >= 12 && saat < 17) return "ikindi";
  if (saat >= 17 && saat < 20) return "aksam";
  return "gece";
}

function yilinGunu(an: Date): number {
  const bas = new Date(an.getFullYear(), 0, 1);
  return Math.floor((an.getTime() - bas.getTime()) / 86400000);
}

/** Tarayıcının yerel saatine göre o dilimin ayetini seçer; gün değiştikçe sırayla döner. */
export function vakitAyetiSec(an: Date): { dilim: DilimAnahtari; ayet: VakitAyeti } {
  const dilim = saattenDilim(an.getHours());
  const liste = (veri.dilimler as Record<DilimAnahtari, VakitAyeti[]>)[dilim];
  const ayet = liste[yilinGunu(an) % liste.length];
  return { dilim, ayet };
}

export const VAKIT_AYETI_KAYNAK = veri.kaynak;
