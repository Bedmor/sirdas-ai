-- Dua Havuzu (Adnan Bey 13.11): yalnız YENİ iki tablo eklenir; mevcut tablolara dokunulmaz.
-- Bu dosya Prisma tarafından üretilen SQL'den (prisma migrate diff) alınmıştır.
-- UYGULANMADI. Canlı veri tabanında henüz migration geçmişi yok (tablolar elle/db push ile kurulmuş),
-- bu yüzden "migrate deploy" P3005 verebilir. Canlıya alırken:
--   npx prisma db execute --file prisma/migrations/20261113220000_dua_havuzu/migration.sql
--   npx prisma migrate resolve --applied 20261113220000_dua_havuzu

-- CreateTable
CREATE TABLE "dua_istekleri" (
    "id" UUID NOT NULL,
    "metin" TEXT NOT NULL,
    "sahip_kimlik_ozeti" VARCHAR(64) NOT NULL,
    "olusturma_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitis_tarihi" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dua_istekleri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dua_destekleri" (
    "id" UUID NOT NULL,
    "dua_istegi_id" UUID NOT NULL,
    "kimlik_ozeti" VARCHAR(64) NOT NULL,
    "olusturma_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dua_destekleri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dua_istekleri_bitis_tarihi_olusturma_tarihi_idx" ON "dua_istekleri"("bitis_tarihi", "olusturma_tarihi");

-- CreateIndex
CREATE INDEX "dua_istekleri_sahip_kimlik_ozeti_olusturma_tarihi_idx" ON "dua_istekleri"("sahip_kimlik_ozeti", "olusturma_tarihi");

-- CreateIndex
CREATE UNIQUE INDEX "dua_destekleri_dua_istegi_id_kimlik_ozeti_key" ON "dua_destekleri"("dua_istegi_id", "kimlik_ozeti");

-- AddForeignKey
ALTER TABLE "dua_destekleri" ADD CONSTRAINT "dua_destekleri_dua_istegi_id_fkey" FOREIGN KEY ("dua_istegi_id") REFERENCES "dua_istekleri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase güvenliği: tablolar herkese açık REST (anon anahtar) üzerinden okunamasın/yazılamasın.
-- Politika tanımlanmadığı için anon ve authenticated rolleri erişemez; uygulama tablo sahibi
-- rolüyle (Prisma bağlantısı) bağlandığı için etkilenmez.
ALTER TABLE "dua_istekleri" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dua_destekleri" ENABLE ROW LEVEL SECURITY;
