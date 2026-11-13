/**
 * Dua Havuzu veri deposu arayüzü ve bellek içi (sahte) depo.
 *
 * - Kimlik hiçbir zaman açık saklanmaz; yalnız tek yönlü özeti (kimlikOzeti) tutulur.
 * - Metin sunucuda hazır seçenekten üretilir; istemciden gelen yazı hiç saklanmaz.
 * - Bellek deposu yerel geliştirme ve testler içindir (canlı veri tabanına bağlanmaz).
 */

export interface DuaKaydi {
  id: string;
  metin: string;
  sahipKimlikOzeti: string;
  olusturmaTarihi: Date;
  bitisTarihi: Date;
}

export interface DuaListeKaydi {
  id: string;
  metin: string;
  olusturmaTarihi: Date;
  bitisTarihi: Date;
  /** Kaç kişi "Allah yardımcın olsun" dedi */
  sayac: number;
  /** Bu cihaz bu isteğe "Allah yardımcın olsun" dedi mi */
  dedim: boolean;
  /** İstek bu cihazdan mı bırakıldı */
  benim: boolean;
}

export type DestekSonucu =
  | { durum: "eklendi"; sayac: number }
  | { durum: "zaten"; sayac: number }
  | { durum: "bulunamadi" }
  | { durum: "kendi" };

export interface DuaDeposu {
  ekle(kayit: { metin: string; sahipKimlikOzeti: string; simdi: Date; bitisTarihi: Date }): Promise<DuaKaydi>;
  /** Süresi geçmemiş ve metni izinli listede olan istekleri yeniden eskiye listeler */
  listele(simdi: Date, kimlikOzeti: string, adet: number, izinliMetinler: readonly string[]): Promise<DuaListeKaydi[]>;
  /** Bu kimliğin kendi (süresi geçmemiş, metni izinli) istekleri */
  benimkiler(simdi: Date, kimlikOzeti: string, izinliMetinler: readonly string[]): Promise<DuaListeKaydi[]>;
  /** Bu kimliğin verilen tarihten sonra bıraktığı istekler (günlük sınır ve tekrar denetimi için) */
  sonIstekler(kimlikOzeti: string, sonra: Date): Promise<Array<{ metin: string; olusturmaTarihi: Date }>>;
  destekle(duaId: string, kimlikOzeti: string, simdi: Date): Promise<DestekSonucu>;
  /** Yalnız istek sahibi kaldırabilir */
  kaldir(duaId: string, sahipKimlikOzeti: string): Promise<boolean>;
  /** Süresi geçen istekleri ve onlara bağlı basışları siler; silinen istek sayısını döndürür */
  suresiGecenleriTemizle(simdi: Date): Promise<number>;
}

function yeniId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dua_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class BellekDuaDeposu implements DuaDeposu {
  private istekler = new Map<string, DuaKaydi>();
  /** duaId -> basan kimlik özetleri */
  private destekler = new Map<string, Set<string>>();

  async ekle(k: { metin: string; sahipKimlikOzeti: string; simdi: Date; bitisTarihi: Date }): Promise<DuaKaydi> {
    const kayit: DuaKaydi = {
      id: yeniId(),
      metin: k.metin,
      sahipKimlikOzeti: k.sahipKimlikOzeti,
      olusturmaTarihi: new Date(k.simdi.getTime()),
      bitisTarihi: new Date(k.bitisTarihi.getTime()),
    };
    this.istekler.set(kayit.id, kayit);
    this.destekler.set(kayit.id, new Set());
    return { ...kayit };
  }

  private listeKaydi(k: DuaKaydi, kimlikOzeti: string): DuaListeKaydi {
    const basanlar = this.destekler.get(k.id) ?? new Set<string>();
    return {
      id: k.id,
      metin: k.metin,
      olusturmaTarihi: k.olusturmaTarihi,
      bitisTarihi: k.bitisTarihi,
      sayac: basanlar.size,
      dedim: basanlar.has(kimlikOzeti),
      benim: k.sahipKimlikOzeti === kimlikOzeti,
    };
  }

  private gecerliler(simdi: Date, izinliMetinler: readonly string[]): DuaKaydi[] {
    return Array.from(this.istekler.values())
      .filter((k) => k.bitisTarihi.getTime() > simdi.getTime() && izinliMetinler.includes(k.metin))
      .sort((a, b) => b.olusturmaTarihi.getTime() - a.olusturmaTarihi.getTime());
  }

  async listele(simdi: Date, kimlikOzeti: string, adet: number, izinliMetinler: readonly string[]): Promise<DuaListeKaydi[]> {
    return this.gecerliler(simdi, izinliMetinler)
      .slice(0, adet)
      .map((k) => this.listeKaydi(k, kimlikOzeti));
  }

  async benimkiler(simdi: Date, kimlikOzeti: string, izinliMetinler: readonly string[]): Promise<DuaListeKaydi[]> {
    return this.gecerliler(simdi, izinliMetinler)
      .filter((k) => k.sahipKimlikOzeti === kimlikOzeti)
      .map((k) => this.listeKaydi(k, kimlikOzeti));
  }

  async sonIstekler(kimlikOzeti: string, sonra: Date) {
    return Array.from(this.istekler.values())
      .filter((k) => k.sahipKimlikOzeti === kimlikOzeti && k.olusturmaTarihi.getTime() > sonra.getTime())
      .map((k) => ({ metin: k.metin, olusturmaTarihi: k.olusturmaTarihi }));
  }

  async destekle(duaId: string, kimlikOzeti: string, simdi: Date): Promise<DestekSonucu> {
    const k = this.istekler.get(duaId);
    if (!k || k.bitisTarihi.getTime() <= simdi.getTime()) return { durum: "bulunamadi" };
    if (k.sahipKimlikOzeti === kimlikOzeti) return { durum: "kendi" };
    const basanlar = this.destekler.get(duaId)!;
    if (basanlar.has(kimlikOzeti)) return { durum: "zaten", sayac: basanlar.size };
    basanlar.add(kimlikOzeti);
    return { durum: "eklendi", sayac: basanlar.size };
  }

  async kaldir(duaId: string, sahipKimlikOzeti: string): Promise<boolean> {
    const k = this.istekler.get(duaId);
    if (!k || k.sahipKimlikOzeti !== sahipKimlikOzeti) return false;
    this.istekler.delete(duaId);
    this.destekler.delete(duaId);
    return true;
  }

  async suresiGecenleriTemizle(simdi: Date): Promise<number> {
    let silinen = 0;
    for (const [id, k] of this.istekler) {
      if (k.bitisTarihi.getTime() <= simdi.getTime()) {
        this.istekler.delete(id);
        this.destekler.delete(id);
        silinen++;
      }
    }
    return silinen;
  }
}
