/**
 * Gönül Defterim: kullanıcının saklamak istediği cevaplar.
 * YALNIZCA bu cihazda (localStorage) tutulur; sunucuya, veritabanına hiçbir şey gitmez.
 * Saf fonksiyonlar depolamayı parametre olarak alır (testte bellek içi depo kullanılır).
 */

export const GONUL_DEFTERI_ANAHTAR = "manevi-pusula:gonul-defteri:v1";
/** Cihazda aşırı yer kaplamasın diye üst sınır; dolunca en eski kayıt düşer. */
export const GONUL_DEFTERI_SINIR = 100;
/** Tek kaydın en uzun metni (karakter). */
export const GONUL_DEFTERI_METIN_SINIR = 8000;
/** Aynı sekmedeki diğer bileşenlere değişikliği duyurmak için olay adı. */
export const GONUL_DEFTERI_OLAY = "mp-gonul-defteri";

export type GonulKaydi = {
  /** Cevabın mesaj kimliği (aynı cevap iki kez eklenmez). */
  id: string;
  metin: string;
  /** Eklenme zamanı (ISO). */
  eklenme: string;
};

export type BasitDepo = Pick<Storage, "getItem" | "setItem">;

function gecerliKayit(x: unknown): x is GonulKaydi {
  if (!x || typeof x !== "object") return false;
  const k = x as Record<string, unknown>;
  return typeof k.id === "string" && k.id.length > 0 && typeof k.metin === "string" && typeof k.eklenme === "string";
}

export function defteriOku(depo: BasitDepo | null | undefined): GonulKaydi[] {
  if (!depo) return [];
  try {
    const ham = depo.getItem(GONUL_DEFTERI_ANAHTAR);
    if (!ham) return [];
    const dizi = JSON.parse(ham);
    return Array.isArray(dizi) ? dizi.filter(gecerliKayit) : [];
  } catch {
    return [];
  }
}

function defteriYaz(depo: BasitDepo, kayitlar: GonulKaydi[]): boolean {
  try {
    depo.setItem(GONUL_DEFTERI_ANAHTAR, JSON.stringify(kayitlar));
    return true;
  } catch {
    return false;
  }
}

export function defterdeMi(kayitlar: GonulKaydi[], id: string): boolean {
  return kayitlar.some((k) => k.id === id);
}

/** Kaydı en başa ekler (en yeni üstte). Zaten varsa listeyi değiştirmez. */
export function deftereEkleListe(kayitlar: GonulKaydi[], kayit: GonulKaydi): GonulKaydi[] {
  if (defterdeMi(kayitlar, kayit.id)) return kayitlar;
  const temiz: GonulKaydi = { ...kayit, metin: kayit.metin.slice(0, GONUL_DEFTERI_METIN_SINIR) };
  return [temiz, ...kayitlar].slice(0, GONUL_DEFTERI_SINIR);
}

export function defterdenCikarListe(kayitlar: GonulKaydi[], id: string): GonulKaydi[] {
  return kayitlar.filter((k) => k.id !== id);
}

/** Ekle/çıkar; yeni listeyi ve işlemin yazılıp yazılamadığını döner. */
export function defterDegistir(
  depo: BasitDepo,
  islem: { tur: "ekle"; kayit: GonulKaydi } | { tur: "cikar"; id: string },
): { liste: GonulKaydi[]; yazildi: boolean } {
  const once = defteriOku(depo);
  const liste = islem.tur === "ekle" ? deftereEkleListe(once, islem.kayit) : defterdenCikarListe(once, islem.id);
  const yazildi = defteriYaz(depo, liste);
  return { liste: yazildi ? liste : once, yazildi };
}
