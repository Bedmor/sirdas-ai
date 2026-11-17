/**
 * Kullanıcının seçtiği cevap uzunluğu (Kısa / Normal / Detaylı).
 * Adnan abi 17.11: "vatandaş cevabın kısa ya da uzun olmasını seçebilsin".
 * NORMAL seçiliyken mevcut bağlama göre esnek uzunluk kuralı aynen çalışır.
 */
export type CevapUzunlugu = "KISA" | "NORMAL" | "UZUN";

export const CEVAP_UZUNLUGU_ANAHTAR = "mp-cevap-uzunlugu";

export const CEVAP_UZUNLUKLARI: ReadonlyArray<{ deger: CevapUzunlugu; etiket: string; aciklama: string }> = [
  { deger: "KISA", etiket: "Kısa", aciklama: "Birkaç cümlelik kısa cevap" },
  { deger: "NORMAL", etiket: "Normal", aciklama: "Konuya göre dengeli uzunluk" },
  { deger: "UZUN", etiket: "Detaylı", aciklama: "Daha geniş ve açıklamalı cevap" },
];

export function cevapUzunluguCoz(deger: unknown): CevapUzunlugu {
  return deger === "KISA" || deger === "UZUN" ? deger : "NORMAL";
}

/** Modele giden uzunluk yönergesi. NORMAL için boş döner (mevcut kural geçerli). */
export function cevapUzunluguYonergesi(uzunluk: CevapUzunlugu): string {
  if (uzunluk === "KISA") {
    return `[KULLANICI TERCİHİ: KISA CEVAP - uzunluk kurallarının ÖNÜNDEDİR] Muhatap kısa cevap istedi. Tek paragraf, en fazla 3-4 cümle (toplam 30-70 kelime) yaz. En fazla 1 kısa ayet veya hadis kullan; giriş ve kapanış uzatma. Güvenlik ve kriz yönlendirmeleri gerekiyorsa yine eksiksiz yaz.`;
  }
  if (uzunluk === "UZUN") {
    return `[KULLANICI TERCİHİ: DETAYLI CEVAP - uzunluk kurallarının ÖNÜNDEDİR] Muhatap detaylı cevap istedi. 3-4 doyurucu paragraf (toplam 200-300 kelime) yaz; konuyu açıklayarak, uygun ayet ve hadislerle ve günlük hayata dönük somut önerilerle derinleştir. Kendini tekrar etme.`;
  }
  return "";
}
