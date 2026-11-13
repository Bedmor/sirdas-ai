/**
 * Sırdaş AI - Dua Havuzu: hazır seçenek kuralları (yerel; yapay zekâya gönderilmez).
 *
 * Adnan Bey'in kararı (14.11): herkesin okuduğu havuzda serbest yazı yok.
 * Kişi yalnızca hazır bir seçeneğe dokunur; kart cümlesi sunucuda bu listeden üretilir.
 * İstemciden gelen hiçbir yazı veri tabanına yazılmaz.
 * Tek cevap düğmesi "Allah yardımcın olsun", sayaç, istek 3 gün sonra listeden düşer.
 */

export const DUA_SURE_GUN = 3;
export const DUA_SURE_MS = DUA_SURE_GUN * 24 * 60 * 60 * 1000;
/** Aynı cihaz kimliğinden 24 saatte bırakılabilecek en fazla istek */
export const DUA_GUNLUK_SINIR = 3;

/** Sabit seçenek listesi (sıra arayüzdeki sıradır). */
export const DUA_KONULARI = [
  { anahtar: "sifa", etiket: "Şifa için", metin: "Bir kardeşimiz şifa için dua istiyor" },
  { anahtar: "sinav", etiket: "Sınav için", metin: "Bir kardeşimiz sınavı için dua istiyor" },
  { anahtar: "rizik", etiket: "İş ve rızık için", metin: "Bir kardeşimiz iş ve rızık için dua istiyor" },
  { anahtar: "aile", etiket: "Aile huzuru için", metin: "Bir kardeşimiz aile huzuru için dua istiyor" },
  { anahtar: "gonul", etiket: "Gönül huzuru için", metin: "Bir kardeşimiz gönül huzuru için dua istiyor" },
  { anahtar: "kapi", etiket: "Hayırlı bir kapı için", metin: "Bir kardeşimiz hayırlı bir kapı açılması için dua istiyor" },
] as const;

export type DuaKonusu = (typeof DUA_KONULARI)[number]["anahtar"];

/** Listede gösterilmesine izin verilen kart cümleleri (eski serbest kayıtlar bunların dışında kalır). */
export const IZINLI_DUA_METINLERI: readonly string[] = DUA_KONULARI.map((k) => k.metin);

export function izinliMetinMi(metin: string): boolean {
  return IZINLI_DUA_METINLERI.includes(metin);
}

export type DuaRedSebebi = "SERBEST_METIN" | "BILINMEYEN_KONU" | "GUNLUK_SINIR" | "TEKRAR" | "COK_HIZLI";

export interface DuaRed {
  tamam: false;
  sebep: DuaRedSebebi;
  mesaj: string;
}

export interface DuaKonuKabul {
  tamam: true;
  konu: DuaKonusu;
  /** Sunucuda üretilen kart cümlesi */
  metin: string;
}

export const DUA_RED_MESAJLARI: Record<DuaRedSebebi, string> = {
  SERBEST_METIN: "Dua havuzuna yazı yazılamaz. Lütfen listeden bir seçeneğe dokunun.",
  BILINMEYEN_KONU: "Bu seçenek bulunamadı. Lütfen listeden bir seçeneğe dokunun.",
  GUNLUK_SINIR: `Bir günde en fazla ${DUA_GUNLUK_SINIR} dua isteği bırakılabilir. Yarın yeniden bırakabilirsiniz.`,
  TEKRAR: "Bu konuda bugün zaten bir istek bıraktınız. İsteğiniz listede duruyor.",
  COK_HIZLI: "Kısa sürede çok fazla istek gönderildi. Lütfen birkaç dakika sonra yeniden deneyin.",
};

export function red(sebep: DuaRedSebebi): DuaRed {
  return { tamam: false, sebep, mesaj: DUA_RED_MESAJLARI[sebep] };
}

/**
 * İstek gövdesini denetler: yalnız { konu: "<anahtar>" } kabul edilir.
 * "metin" alanı (ya da konu dışında herhangi bir yazı alanı) gelirse reddedilir.
 */
export function duaKonusunuDenetle(govde: unknown): DuaKonuKabul | DuaRed {
  const g = (govde && typeof govde === "object" ? govde : {}) as Record<string, unknown>;
  if ("metin" in g) return red("SERBEST_METIN");
  const fazlaAlan = Object.keys(g).some((a) => a !== "konu");
  if (fazlaAlan) return red("SERBEST_METIN");
  const konu = DUA_KONULARI.find((k) => k.anahtar === g.konu);
  if (!konu) return red("BILINMEYEN_KONU");
  return { tamam: true, konu: konu.anahtar, metin: konu.metin };
}
