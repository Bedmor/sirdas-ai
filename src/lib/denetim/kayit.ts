/**
 * Sırdaş AI - Etik denetim ve yanlış alarm kaydı.
 *
 * Kaynak: Adnan Bey 12.11 maili, madde 11 (Etik Denetim ve Yanlış Pozitif Loglama).
 * Güvenlik ön süzgeci, manevi kalkanlar, giriş maskelemesi ve çıkış süzgeci tetiklendiğinde
 * İÇERİK YAZMADAN kayıt tutulur: yalnızca tür, kural kodu, eylem, adet, zaman, kanal ve mod.
 *
 * Kayıt iki yere düşer:
 *  1) Sunucu günlüğü (Vercel Logs): "[SIRDAS_DENETIM] {json}" satırı (her zaman).
 *  2) Kalıcı oturumlarda asistan mesajının mevcut editorAudit alanına "denetim" anahtarı
 *     (yeni tablo yok). Geçici (veri saklanmayan) oturumlarda yalnızca sunucu günlüğü kalır.
 */

export type DenetimTuru =
  | "GUVENLIK_ON_SUZGECI"
  | "MANEVI_KALKAN"
  | "GIRIS_MASKELEME"
  | "CIKIS_SUZGECI";

export interface DenetimOlayi {
  tur: DenetimTuru;
  kuralKodu: string;
  eylem?: string;
  adet?: number;
}

export interface DenetimKaydi {
  surum: 1;
  zaman: string;
  kanal: "chat" | "trial";
  mod: string;
  durum: string;
  olaylar: DenetimOlayi[];
}

export interface DenetimGeriBildirimi {
  yersiz: boolean;
  kuralKodu: string | null;
  zaman: string;
}

const KOD_DESENI = /^[A-ZÇĞİÖŞÜ0-9_]{2,64}$/;
const TURLER: ReadonlySet<string> = new Set<DenetimTuru>([
  "GUVENLIK_ON_SUZGECI",
  "MANEVI_KALKAN",
  "GIRIS_MASKELEME",
  "CIKIS_SUZGECI",
]);

/** Yalnızca BÜYÜK_HARF_KOD biçimindeki değerleri kabul eder; serbest metin (içerik) kayda giremez. */
export function koduTemizle(deger: unknown): string | null {
  if (typeof deger !== "string") return null;
  const k = deger.trim().toLocaleUpperCase("tr-TR");
  return KOD_DESENI.test(k) ? k : null;
}

function olayTemizle(o: DenetimOlayi): DenetimOlayi | null {
  if (!o || !TURLER.has(o.tur)) return null;
  const kuralKodu = koduTemizle(o.kuralKodu);
  if (!kuralKodu) return null;
  const temiz: DenetimOlayi = { tur: o.tur, kuralKodu };
  const eylem = koduTemizle(o.eylem);
  if (eylem) temiz.eylem = eylem;
  if (typeof o.adet === "number" && Number.isFinite(o.adet) && o.adet > 0) {
    temiz.adet = Math.min(999, Math.floor(o.adet));
  }
  return temiz;
}

export function denetimKaydiOlustur(params: {
  kanal: "chat" | "trial";
  mod?: string | null;
  durum?: string | null;
  olaylar: ReadonlyArray<DenetimOlayi | null | undefined>;
  zaman?: Date;
}): DenetimKaydi {
  const olaylar = params.olaylar
    .filter((o): o is DenetimOlayi => Boolean(o))
    .map(olayTemizle)
    .filter((o): o is DenetimOlayi => Boolean(o));
  return {
    surum: 1,
    zaman: (params.zaman ?? new Date()).toISOString(),
    kanal: params.kanal,
    mod: koduTemizle(params.mod) ?? "BILINMIYOR",
    durum: koduTemizle(params.durum) ?? "BILINMIYOR",
    olaylar,
  };
}

/** Sunucu günlüğüne tek satır yapılandırılmış kayıt yazar (olay yoksa yazmaz). */
export function denetimKaydiYaz(
  kayit: DenetimKaydi,
  yazici: (satir: string) => void = (s) => console.info(s)
): void {
  if (!kayit.olaylar.length) return;
  try {
    yazici(`[SIRDAS_DENETIM] ${JSON.stringify(kayit)}`);
  } catch {
    // Günlük yazılamazsa sohbet akışı etkilenmez.
  }
}

/** Kullanıcının "bu uyarı yersiz miydi?" geri bildirimi için günlük satırı. */
export function denetimGeriBildirimiYaz(
  bildirim: DenetimGeriBildirimi & { kayitli: boolean },
  yazici: (satir: string) => void = (s) => console.info(s)
): void {
  try {
    yazici(
      `[SIRDAS_DENETIM_GERI_BILDIRIM] ${JSON.stringify({
        yersiz: bildirim.yersiz,
        kuralKodu: koduTemizle(bildirim.kuralKodu),
        zaman: bildirim.zaman,
        kayitli: bildirim.kayitli,
      })}`
    );
  } catch {
    // yut
  }
}

export interface DenetimOzeti {
  incelenenMesaj: number;
  denetimliMesaj: number;
  kurallar: Array<{
    tur: DenetimTuru;
    kuralKodu: string;
    adet: number;
    yersizBildirim: number;
  }>;
  yersizBildirimToplam: number;
}

/** Yönetim paneli için: asistan mesajlarının editorAudit alanlarından denetim özetini çıkarır. */
export function denetimOzetiCikar(
  editorAuditler: ReadonlyArray<unknown>
): DenetimOzeti {
  const sayac = new Map<string, DenetimOzeti["kurallar"][number]>();
  let denetimli = 0;
  let yersizToplam = 0;

  for (const ea of editorAuditler) {
    if (!ea || typeof ea !== "object") continue;
    const kayit = (ea as { denetim?: DenetimKaydi }).denetim;
    const geri = (ea as { denetimGeriBildirimi?: DenetimGeriBildirimi }).denetimGeriBildirimi;
    if (!kayit || !Array.isArray(kayit.olaylar) || kayit.olaylar.length === 0) continue;
    denetimli++;
    const yersiz = Boolean(geri?.yersiz);
    if (yersiz) yersizToplam++;
    const geriKod = koduTemizle(geri?.kuralKodu);
    for (const o of kayit.olaylar) {
      const temiz = olayTemizle(o);
      if (!temiz) continue;
      const anahtar = `${temiz.tur}:${temiz.kuralKodu}`;
      const satir =
        sayac.get(anahtar) ??
        { tur: temiz.tur, kuralKodu: temiz.kuralKodu, adet: 0, yersizBildirim: 0 };
      satir.adet += 1;
      if (yersiz && (!geriKod || geriKod === temiz.kuralKodu)) satir.yersizBildirim += 1;
      sayac.set(anahtar, satir);
    }
  }

  return {
    incelenenMesaj: editorAuditler.length,
    denetimliMesaj: denetimli,
    kurallar: Array.from(sayac.values()).sort((a, b) => b.adet - a.adet),
    yersizBildirimToplam: yersizToplam,
  };
}

/** Sohbet/deneme akışındaki süzgeç sonuçlarını içeriksiz denetim olaylarına çevirir. */
export function sohbetDenetimOlaylari(params: {
  guvenlik?: { ruleId: string; bypassModel: boolean } | null;
  kalkanKuralKodu?: string | null;
  maskeKategorileri?: ReadonlyArray<string>;
  cikisOlaylari?: ReadonlyArray<{ kuralKodu: string; eylem: string; adet: number }>;
}): DenetimOlayi[] {
  const olaylar: DenetimOlayi[] = [];
  if (params.guvenlik) {
    olaylar.push({
      tur: "GUVENLIK_ON_SUZGECI",
      kuralKodu: params.guvenlik.ruleId,
      eylem: params.guvenlik.bypassModel ? "MODEL_ATLANDI" : "DIPNOT_EKLENDI",
    });
  }
  if (params.kalkanKuralKodu && !params.kalkanKuralKodu.startsWith("SAFETY_")) {
    olaylar.push({ tur: "MANEVI_KALKAN", kuralKodu: params.kalkanKuralKodu, eylem: "HAZIR_CEVAP" });
  }
  for (const k of params.maskeKategorileri ?? []) {
    olaylar.push({ tur: "GIRIS_MASKELEME", kuralKodu: k, eylem: "MASKELENDI" });
  }
  for (const o of params.cikisOlaylari ?? []) {
    olaylar.push({ tur: "CIKIS_SUZGECI", kuralKodu: o.kuralKodu, eylem: o.eylem, adet: o.adet });
  }
  return olaylar;
}
