import { BellekDuaDeposu, type DuaDeposu } from "./depo";

/**
 * Hangi deponun kullanılacağını seçer.
 * - DUA_HAVUZU_DEPO=bellek ya da DATABASE_URL tanımlı değilse: bellek içi sahte depo
 *   (yerel deneme; sunucu yeniden başlayınca boşalır, veri tabanına hiç bağlanılmaz).
 * - Aksi hâlde: Prisma (PostgreSQL) deposu. Tablolar canlıya alınmadan önce
 *   prisma/migrations/20261113220000_dua_havuzu uygulanmalıdır.
 */
const kuresel = globalThis as unknown as {
  duaBellekDeposu?: BellekDuaDeposu;
  duaPrismaDeposu?: DuaDeposu;
};

export function bellekKullanilsinMi(): boolean {
  return process.env.DUA_HAVUZU_DEPO === "bellek" || !process.env.DATABASE_URL;
}

export async function duaDeposunuAl(): Promise<DuaDeposu> {
  if (bellekKullanilsinMi()) {
    if (!kuresel.duaBellekDeposu) kuresel.duaBellekDeposu = new BellekDuaDeposu();
    return kuresel.duaBellekDeposu;
  }
  if (!kuresel.duaPrismaDeposu) {
    // Prisma yalnız bu dalda yüklenir; bellek kipinde veri tabanı istemcisi hiç oluşturulmaz.
    const [{ prisma }, { PrismaDuaDeposu }] = await Promise.all([
      import("../db/prisma"),
      import("./prisma-depo"),
    ]);
    kuresel.duaPrismaDeposu = new PrismaDuaDeposu(prisma);
  }
  return kuresel.duaPrismaDeposu;
}
