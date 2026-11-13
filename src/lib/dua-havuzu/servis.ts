import crypto from "crypto";
import type { DestekSonucu, DuaDeposu, DuaListeKaydi } from "./depo";
import {
  DUA_GUNLUK_SINIR,
  DUA_SURE_MS,
  IZINLI_DUA_METINLERI,
  duaKonusunuDenetle,
  red,
  type DuaRed,
} from "./kurallar";

/** Listede bir seferde gösterilecek en fazla istek */
export const DUA_LISTE_ADEDI = 50;

/**
 * Cihaz kimliğinin tek yönlü özeti. Kimliğin kendisi veri tabanına yazılmaz.
 * Tuz ortam değişkeninden okunur (DUA_HAVUZU_TUZ); yoksa sabit bir varsayılan kullanılır.
 */
export function kimlikOzetiCikar(cihazKimligi: string): string {
  const tuz = process.env.DUA_HAVUZU_TUZ || "sirdas-dua-havuzu-v1";
  return crypto.createHash("sha256").update(`dua::${tuz}::${cihazKimligi}`).digest("hex");
}

export interface DuaGorunumu {
  id: string;
  metin: string;
  olusturma: string;
  bitis: string;
  sayac: number;
  dedim: boolean;
  benim: boolean;
}

function gorunum(k: DuaListeKaydi): DuaGorunumu {
  return {
    id: k.id,
    metin: k.metin,
    olusturma: k.olusturmaTarihi.toISOString(),
    bitis: k.bitisTarihi.toISOString(),
    sayac: k.sayac,
    dedim: k.dedim,
    benim: k.benim,
  };
}

export type BirakmaSonucu = { tamam: true; istek: DuaGorunumu } | DuaRed;

/**
 * Yeni dua isteği bırakır. Gövde yalnız { konu: "<anahtar>" } olabilir;
 * kart cümlesi sunucuda üretilir. Sıra: konu denetimi, aynı konu tekrarı, günlük sınır, kayıt.
 */
export async function duaIstegiBirak(
  depo: DuaDeposu,
  girdi: { kimlikOzeti: string; govde: unknown; simdi?: Date }
): Promise<BirakmaSonucu> {
  const simdi = girdi.simdi ?? new Date();
  const denetim = duaKonusunuDenetle(girdi.govde);
  if (!denetim.tamam) return denetim;

  const birGunOnce = new Date(simdi.getTime() - 24 * 60 * 60 * 1000);
  const son = await depo.sonIstekler(girdi.kimlikOzeti, birGunOnce);
  if (son.some((s) => s.metin === denetim.metin)) return red("TEKRAR");
  if (son.length >= DUA_GUNLUK_SINIR) return red("GUNLUK_SINIR");

  const kayit = await depo.ekle({
    metin: denetim.metin,
    sahipKimlikOzeti: girdi.kimlikOzeti,
    simdi,
    bitisTarihi: new Date(simdi.getTime() + DUA_SURE_MS),
  });
  return {
    tamam: true,
    istek: gorunum({
      id: kayit.id,
      metin: kayit.metin,
      olusturmaTarihi: kayit.olusturmaTarihi,
      bitisTarihi: kayit.bitisTarihi,
      sayac: 0,
      dedim: false,
      benim: true,
    }),
  };
}

/** Herkese açık liste (süresi geçenler ve hazır seçenek dışı eski kayıtlar hariç) ve bu cihazın kendi istekleri. */
export async function duaHavuzunuGetir(
  depo: DuaDeposu,
  girdi: { kimlikOzeti: string; simdi?: Date }
): Promise<{ istekler: DuaGorunumu[]; benimkiler: DuaGorunumu[] }> {
  const simdi = girdi.simdi ?? new Date();
  const [hepsi, benim] = await Promise.all([
    depo.listele(simdi, girdi.kimlikOzeti, DUA_LISTE_ADEDI, IZINLI_DUA_METINLERI),
    depo.benimkiler(simdi, girdi.kimlikOzeti, IZINLI_DUA_METINLERI),
  ]);
  return {
    // Kendi istekleri üstte ayrı gösterilir; genel listede tekrar edilmez.
    istekler: hepsi.filter((k) => !k.benim).map(gorunum),
    benimkiler: benim.map(gorunum),
  };
}

/** "Allah yardımcın olsun" basışı: aynı cihaz aynı isteğe bir kez. */
export async function allahYardimcinOlsun(
  depo: DuaDeposu,
  girdi: { kimlikOzeti: string; duaId: unknown; simdi?: Date }
): Promise<DestekSonucu> {
  if (typeof girdi.duaId !== "string" || !/^[\w-]{8,64}$/.test(girdi.duaId)) {
    return { durum: "bulunamadi" };
  }
  return depo.destekle(girdi.duaId, girdi.kimlikOzeti, girdi.simdi ?? new Date());
}

export async function duaIsteginiKaldir(
  depo: DuaDeposu,
  girdi: { kimlikOzeti: string; duaId: unknown }
): Promise<boolean> {
  if (typeof girdi.duaId !== "string" || !/^[\w-]{8,64}$/.test(girdi.duaId)) return false;
  return depo.kaldir(girdi.duaId, girdi.kimlikOzeti);
}

/**
 * Süresi geçen (3 günü dolan) istekleri siler.
 * Zamanlanmış iş YOKTUR; yalnız yeni istek bırakılırken fırsat buldukça çağrılır.
 */
export function suresiGecenDualariTemizle(depo: DuaDeposu, simdi: Date = new Date()): Promise<number> {
  return depo.suresiGecenleriTemizle(simdi);
}
