/**
 * "Bu uyarı yersiz miydi?" bağlantısının istemci tarafı yardımcıları.
 *
 * Sunucu (/api/chat) cevapla birlikte asistan mesaj numarasını ve tetiklenen
 * denetim olaylarını ({ tur, kuralKodu }) gönderir; içerik gelmez.
 * Bağlantı yalnız kullanıcının fark edebileceği bir uyarı/süzgeç devreye
 * girdiğinde gösterilir. Giriş maskelemesi (kişisel bilgi gizleme) kullanıcıya
 * uyarı olarak görünmediği için sayılmaz.
 */

export interface DenetimIzi {
  tur: string;
  kuralKodu: string;
}

/** Kullanıcıya uyarı olarak yansıyan denetim türleri */
export const UYARI_TURLERI: readonly string[] = [
  "GUVENLIK_ON_SUZGECI",
  "MANEVI_KALKAN",
  "CIKIS_SUZGECI",
];

const KOD_DESENI = /^[A-ZÇĞİÖŞÜ0-9_]{2,64}$/;

/** Sunucudan gelen ham değeri güvenli bir denetim izi listesine çevirir. */
export function denetimIzleriniAyikla(ham: unknown): DenetimIzi[] {
  if (!Array.isArray(ham)) return [];
  const sonuc: DenetimIzi[] = [];
  for (const o of ham) {
    if (!o || typeof o !== "object") continue;
    const { tur, kuralKodu } = o as Record<string, unknown>;
    if (typeof tur !== "string" || typeof kuralKodu !== "string") continue;
    if (!KOD_DESENI.test(tur) || !KOD_DESENI.test(kuralKodu)) continue;
    sonuc.push({ tur, kuralKodu });
    if (sonuc.length >= 12) break;
  }
  return sonuc;
}

/** Bu cevabın altında "Bu uyarı yersiz miydi?" gösterilsin mi? */
export function uyariTetiklendi(izler: ReadonlyArray<DenetimIzi> | undefined): boolean {
  return !!izler?.some((o) => UYARI_TURLERI.includes(o.tur));
}

/** Bildirime yazılacak kural kodu: ilk uyarı olayının kodu. */
export function bildirilecekKuralKodu(
  izler: ReadonlyArray<DenetimIzi> | undefined,
): string | null {
  return izler?.find((o) => UYARI_TURLERI.includes(o.tur))?.kuralKodu ?? null;
}

/** /api/chat/denetim-bildirimi uç noktasına gidecek gövde (içerik yok). */
export function yersizBildirimGovdesi(params: {
  sunucuMesajId?: string | null;
  izler?: ReadonlyArray<DenetimIzi>;
  clientId?: string | null;
}): { yersiz: true; kuralKodu: string | null; messageId?: string; clientId?: string } {
  return {
    yersiz: true,
    kuralKodu: bildirilecekKuralKodu(params.izler),
    ...(params.sunucuMesajId ? { messageId: params.sunucuMesajId } : {}),
    ...(params.clientId ? { clientId: params.clientId } : {}),
  };
}
