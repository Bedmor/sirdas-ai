import type { PrismaClient } from "../../../prisma/generated/client";
import type { DestekSonucu, DuaDeposu, DuaKaydi, DuaListeKaydi } from "./depo";

/**
 * Dua Havuzu: PostgreSQL (Prisma) deposu.
 * Tablolar: dua_istekleri, dua_destekleri (prisma/migrations/20261113220000_dua_havuzu).
 * Tek basış kuralı veri tabanında benzersiz anahtarla da korunur (dua_istegi_id + kimlik_ozeti).
 */
export class PrismaDuaDeposu implements DuaDeposu {
  constructor(private readonly db: PrismaClient) {}

  async ekle(k: { metin: string; sahipKimlikOzeti: string; simdi: Date; bitisTarihi: Date }): Promise<DuaKaydi> {
    const r = await this.db.duaIstegi.create({
      data: {
        metin: k.metin,
        sahipKimlikOzeti: k.sahipKimlikOzeti,
        olusturmaTarihi: k.simdi,
        bitisTarihi: k.bitisTarihi,
      },
    });
    return {
      id: r.id,
      metin: r.metin,
      sahipKimlikOzeti: r.sahipKimlikOzeti,
      olusturmaTarihi: r.olusturmaTarihi,
      bitisTarihi: r.bitisTarihi,
    };
  }

  private async liste(
    where: { bitisTarihi: { gt: Date }; sahipKimlikOzeti?: string },
    kimlikOzeti: string,
    adet: number
  ): Promise<DuaListeKaydi[]> {
    const satirlar = await this.db.duaIstegi.findMany({
      where,
      orderBy: { olusturmaTarihi: "desc" },
      take: adet,
      select: {
        id: true,
        metin: true,
        sahipKimlikOzeti: true,
        olusturmaTarihi: true,
        bitisTarihi: true,
        _count: { select: { destekler: true } },
        destekler: { where: { kimlikOzeti }, select: { id: true }, take: 1 },
      },
    });
    return satirlar.map((s) => ({
      id: s.id,
      metin: s.metin,
      olusturmaTarihi: s.olusturmaTarihi,
      bitisTarihi: s.bitisTarihi,
      sayac: s._count.destekler,
      dedim: s.destekler.length > 0,
      benim: s.sahipKimlikOzeti === kimlikOzeti,
    }));
  }

  listele(simdi: Date, kimlikOzeti: string, adet: number) {
    return this.liste({ bitisTarihi: { gt: simdi } }, kimlikOzeti, adet);
  }

  benimkiler(simdi: Date, kimlikOzeti: string) {
    return this.liste({ bitisTarihi: { gt: simdi }, sahipKimlikOzeti: kimlikOzeti }, kimlikOzeti, 20);
  }

  async sonIstekler(kimlikOzeti: string, sonra: Date) {
    return this.db.duaIstegi.findMany({
      where: { sahipKimlikOzeti: kimlikOzeti, olusturmaTarihi: { gt: sonra } },
      select: { metin: true, olusturmaTarihi: true },
    });
  }

  async destekle(duaId: string, kimlikOzeti: string, simdi: Date): Promise<DestekSonucu> {
    const istek = await this.db.duaIstegi.findFirst({
      where: { id: duaId, bitisTarihi: { gt: simdi } },
      select: { id: true, sahipKimlikOzeti: true },
    });
    if (!istek) return { durum: "bulunamadi" };
    if (istek.sahipKimlikOzeti === kimlikOzeti) return { durum: "kendi" };

    let durum: "eklendi" | "zaten" = "eklendi";
    try {
      await this.db.duaDestegi.create({ data: { duaIstegiId: duaId, kimlikOzeti, olusturmaTarihi: simdi } });
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") durum = "zaten";
      else throw err;
    }
    const sayac = await this.db.duaDestegi.count({ where: { duaIstegiId: duaId } });
    return { durum, sayac };
  }

  async kaldir(duaId: string, sahipKimlikOzeti: string): Promise<boolean> {
    const r = await this.db.duaIstegi.deleteMany({ where: { id: duaId, sahipKimlikOzeti } });
    return r.count > 0;
  }

  async suresiGecenleriTemizle(simdi: Date): Promise<number> {
    // dua_destekleri satırları yabancı anahtardaki ON DELETE CASCADE ile birlikte silinir.
    const r = await this.db.duaIstegi.deleteMany({ where: { bitisTarihi: { lte: simdi } } });
    return r.count;
  }
}
