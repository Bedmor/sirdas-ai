# Sırdaş AI — Bütünsel İslami Rehberlik ve Dijital Sırdaşlık Platformu
## Kapsamlı Uygulama ve Sistem Mimarisi Planı (Implementation & Architecture Plan)

> **Sürüm:** 1.1.0-PROD-ARCHITECTURE  
> **Hedef:** Sıfırdan Canlıya (Production-Ready) Eksiksiz Dağıtım  
> **Temel Felsefe:** "Zakir (Hatırlatıcı / Ayna)" — Fıkhi fetva makamı veya kuru bir ansiklopedi değil; kulun modern hayatın krizlerinde (borç, öfke, aile, iş stresi, gelecek kaygısı) kendi nefsi ve şeytanın vesveseleriyle yüzleşmesini sağlayan; Kur'an-ı Kerim, Sünnet, Siyer ve Halis Aydemir hocanın sohbet külliyatını temel alan bir manevi rehberlik platformu.

---

## BÖLÜM 1: ÜST DÜZEY SİSTEM VE AKIŞ MİMARİSİ

```
[ KULLANICI ]
      │
      ▼  (WhatsApp Mesajı)
[ Meta WhatsApp Cloud API ]
      │
      ▼  (POST /api/webhook/whatsapp - HMAC SHA-256 İmzalı)
[ Next.js 15 Webhook Handler (Vercel) ]
      │
      ├──> [Anında 200 OK Dönüşü (3 saniye altı SLA garantisi - <50ms)]
      │
      └──> [next/server after() Asenkron Arka Plan Hattı - maxDuration=60s]
                │
                ├── 0. Idempotency & Mükerrer Mesaj Kilidi (wa_message_id check)
                │
                ├── 1. Onboarding Kontrolü ("4 Bloklu Dijital İkiz Künyesi")
                │      └─ onboarding_completed == false ise: Sohbet modunda profil adımı işlet
                │
                ├── 2. Jev API (System 1 - Refleks, Guardrail & Sınıflandırma)
                │      ├── Noul: is_fiqh_fatwa_request >= 0.75 ──> [GEMINI BYPASS! FETVA BLOKAJI GÖNDER & ÇIK]
                │      ├── Noul: is_debt_or_riba_related >= 0.60 ──> [RIBA_SHIELD_ACTIVE = true]
                │      ├── Noul: needs_audio_snippet >= 0.70 ──> [SES KESİTİ SEÇİMİNİ TETİKLE]
                │      ├── Choice: nafs_trap & rag_category
                │      └── Score: distress_level (>= 8 ise profil ne olursa olsun şefkate yumuşat)
                │
                ├── 3. Çelik Kasa (Hybrid RAG - Supabase pgvector)
                │      ├── text-embedding-004 (768d vektör)
                │      └── RPC match_knowledge_chunks (Çoklu Kaynak Dengesi):
                │            ├─ 1x En Uygun Kur'an Pasajı (Ayet Grubu + Kısa Tefsir)
                │            ├─ 1x En Uygun Sahih Hadis / Siyer Örneği
                │            ├─ 1x En Uygun Halis Aydemir Sesli Sohbet Parçası (Cloudflare R2 .ogg linki)
                │            └─ (RIBA_SHIELD_ACTIVE = true ise: Bakara 275-279 Paketi ZORUNLU İLAVE)
                │
                ├── 4. Google Gemini 2.5 Flash (System 2 - Yazar + İçsel Editör)
                │      ├── Context Cache: Değişmez Sistem Anayasası (5 Manevi Süzgeç + Siyer Mührü)
                │      ├── Girdi: Kullanıcı İkizi + Jev Teşhis Raporu + Çelik Kasa RAG Sonuçları
                │      └── Structured Output (Zod Schema): editor_audit + whatsapp_reply + audio_id
                │
                └── 5. Dağıtım, Kayıt ve Raporlama Katmanı
                       ├── Meta Graph API: Yazılı Cevap Gönderimi
                       ├── Meta Graph API: Varsa Cloudflare R2'den .ogg (libopus) Ses Gönderimi
                       ├── Supabase: Mesaj, Audit Log ve Profil Güncellemesi Kaydı
                       └── VasDailyLog: Operatör VAS Dakika ve Mesaj Hacmi Atomik Sayacı
```

### Maliyet ve Gecikme Optimizasyonu Mimarisi
1. **Jev (System 1):** $0.042 / 1M input token, $0 output token. Fıkhi fetva sorularında Gemini'yi tamamen devreden çıkararak API maliyetini ve gereksiz model yükünü engeller.
2. **Gemini 2.5 Flash (System 2) Context Caching:** Değişmeyen 2.000+ token'lık "Sistem Anayasası" önbelleğe alınır, girdi maliyeti %75-80 oranında düşer, ilk token gecikmesi (TTFT) minimize edilir.
3. **Cloudflare R2:** Halis Aydemir hoca ses kesitleri için sıfır egress (çıkış trafiği) ücreti.
4. **Next.js 15 `after()`:** Serverless ortamında Meta'nın 3 saniyelik webhook kuralını ihlal etmeden asenkron çalışır (`export const maxDuration = 60`).

---

## BÖLÜM 2: MONOREPO VE KLASÖR MİMARİSİ

```
sirdas-ai/
├── .env.example                     # Tüm ortam değişkenlerinin örnek şablonu
├── .gitignore                       # Node, Python, venv, audio ve temp istisnaları
├── package.json                     # Next.js 15, React 19, Prisma, Zod, @google/genai, Lucide
├── tsconfig.json                    # Strict TypeScript yapılandırması (@/* alias)
├── next.config.ts                   # Next.js 15 yapılandırması (after() desteği)
├── tailwind.config.ts               # Tailwind CSS & shadcn tema konfigürasyonu
├── postcss.config.mjs
├── components.json                  # shadcn/ui konfigürasyonu
├── README.md                        # Kurulum ve çalıştırma kılavuzu
├── IMPLEMENTATION_PLAN.md           # Bu mimari plan
│
├── prisma/
│   ├── schema.prisma                # Veritabanı veri modelleri (User, Message, Knowledge, Donation, Vas)
│   ├── migrations/                  # Prisma migration geçmişi
│   └── sql/
│       ├── 01_pgvector_init.sql     # pgvector uzantısı, HNSW ve GIN indeksleri
│       └── 02_hybrid_search_rpc.sql # match_knowledge_chunks RPC fonksiyonu (Çoklu kaynak garantili)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Kök layout, fontlar, Toaster, Metadata
│   │   ├── page.tsx                 # Kurumsal vitrin, Meta doğrulaması, wa.me CTA, Disclaimer
│   │   ├── globals.css              # Tailwind değişkenleri ve küresel stiller
│   │   ├── gizlilik-politikasi/
│   │   │   └── page.tsx             # KVKK / Meta Business uyumlu Gizlilik Politikası
│   │   ├── sorumluluk-reddi/
│   │   │   └── page.tsx             # Şer'i sınır ve hukuki fetva/kriz disclaimer'ı
│   │   ├── askida-sirdas/
│   │   │   ├── page.tsx             # Gönüllü bağış ekranı ve şeffaf havuz sayacı (PayTR/iyzico)
│   │   │   ├── basarili/
│   │   │   │   └── page.tsx         # Bağış onay ve dua teşekkür ekranı
│   │   │   └── hata/
│   │   │       └── page.tsx         # Başarısız ödeme bildirim ekranı
│   │   ├── admin/
│   │   │   ├── page.tsx             # Yönetim paneli ana görünüm (Metrikler & Özet)
│   │   │   ├── vas-reports/
│   │   │   │   └── page.tsx         # Operatör dakika ve mesaj hacmi raporlama ekranı
│   │   │   ├── audit-logs/
│   │   │   │   └── page.tsx         # Jev kararları & Gemini editor_audit log izleme
│   │   │   └── knowledge/
│   │   │       └── page.tsx         # Çelik Kasa RAG içerik arama ve ses dinleme ekranı
│   │   └── api/
│   │       ├── webhook/
│   │       │   ├── whatsapp/
│   │       │   │   └── route.ts     # Meta Webhook (GET verify + POST after() worker, maxDuration=60)
│   │       │   └── payment/
│   │       │       └── route.ts     # PayTR / iyzico IPN callback webhook
│   │       ├── admin/
│   │       │   ├── stats/
│   │       │   │   └── route.ts     # Admin paneli istatistik endpoint'i
│   │       │   └── vas-export/
│   │       │       └── route.ts     # Operatör VAS CSV/JSON veri dışa aktarımı
│   │       └── health/
│   │           └── route.ts         # Sistem sağlık kontrolü (Uptime monitoring)
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── jev-client.ts        # Jev TypeSafe AI istemcisi (Noul, Choice, Score + Fallback)
│   │   │   ├── gemini-client.ts     # Gemini 2.5 Flash SDK & Context Cache yöneticisi
│   │   │   ├── embeddings.ts        # Google text-embedding-004 vektörleştirici (768d)
│   │   │   ├── constitution.ts      # Değişmez Sırdaş AI Sistem Anayasası metni
│   │   │   ├── schemas.ts           # SirdasOutputSchema Zod şeması
│   │   │   └── orchestrator.ts      # Bilişsel boru hattı ana orkestratörü (processIncomingMessage)
│   │   ├── db/
│   │   │   ├── prisma.ts            # PrismaClient singleton instance
│   │   │   └── supabase.ts          # Supabase Client (RPC vektör aramaları için)
│   │   ├── whatsapp/
│   │   │   ├── client.ts            # Meta Graph API metin ve ses gönderme istemcisi
│   │   │   ├── security.ts          # X-Hub-Signature-256 HMAC SHA-256 doğrulama
│   │   │   ├── types.ts             # Meta Webhook payload TypeScript tipleri
│   │   │   └── onboarding.ts        # 4 Bloklu Dijital İkiz Künyesi State Machine
│   │   ├── storage/
│   │   │   └── r2.ts                # Cloudflare R2 S3-uyumlu istemci
│   │   ├── payment/
│   │   │   ├── paytr.ts             # PayTR token oluşturma ve hash doğrulama
│   │   │   └── iyzico.ts            # Alternatif iyzico Checkout Form entegrasyonu
│   │   └── utils/
│   │       ├── rate-limit.ts        # Telefon bazlı mesaj sıklık denetimi
│   │       └── logger.ts            # Yapılandırılmış JSON loglayıcı
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui bileşenleri (button, card, dialog, badge vb.)
│   │   ├── landing/
│   │   │   ├── hero.tsx             # Ana başlık, manevi vizyon ve wa.me butonu
│   │   │   ├── manifesto.tsx        # "Neden Fetva Değil, Ayna?" manifestosu
│   │   │   ├── features.tsx         # 4 Bloklu İkiz, Halis Hoca Sesi, Sahih Kaynak
│   │   │   ├── legal-disclaimer.tsx # Kalıcı Şer'i ve Hukuki Uyarı Kutusu
│   │   │   └── footer.tsx           # Kurumsal linkler ve Meta uyumluluk künyesi
│   │   ├── donation/
│   │   │   ├── donation-box.tsx     # Esnek tutarlı bağış formu
│   │   │   └── pool-counter.tsx     # Askıda Sırdaş şeffaf havuz sayacı
│   │   └── admin/
│   │       ├── metric-cards.tsx     # Kullanıcı, mesaj, VAS dakika kartları
│   │       ├── audit-table.tsx      # Gemini editor_audit log tablosu
│   │       └── vas-chart.tsx        # Operatör hacim grafiği
│   │
│   └── types/
│       └── index.ts                 # Genel tip tanımları
│
└── data-pipeline/                   # Lokal NVIDIA RTX 4060 GPU Veri İşleme Hattı
    ├── README.md                    # Pipeline çalıştırma ve CUDA kurulum rehberi
    ├── requirements.txt             # PyTorch, WhisperX, yt-dlp, boto3, supabase, google-genai
    ├── config.py                    # CUDA ayarları, API anahtarları, R2 ve DB yapılandırması
    ├── ingest_texts.py              # Kur'an, Hadis, Siyer ve Dua indeksleme betiği
    ├── ingest_youtube.py            # Halis Aydemir YouTube ses indirme, WhisperX, overlapping kesme
    ├── utils/
    │   ├── __init__.py
    │   ├── jev_tagger.py            # Python Jev API istemcisi (metin etiketleme)
    │   ├── embedder.py              # text-embedding-004 Python istemcisi
    │   ├── audio_cutter.py          # FFmpeg Opus (-c:a libopus -b:a 32k) kesme motoru
    │   └── r2_uploader.py           # Cloudflare R2 boto3 yükleme motoru (ContentType: audio/ogg)
    └── data/
        ├── raw/                     # Ham Kur'an mealleri, Sahih-i Buhari/Müslim JSON'ları
        │   ├── quran_semantic.json  # Anlamsal pasajlar (Bakara 275-279 dahil)
        │   ├── hadith_sahih.json    # Buhari, Müslim ve Riyazü's-Salihin seçkisi
        │   └── siyer_dualar.json    # Peygamberimiz ve ashabın hayatından sahneler
        └── temp_audio/              # Geçici indirilen m4a/ogg ses dosyaları (.gitignore'da)
```

---

## BÖLÜM 3: VERİTABANI VE SQL PLANI (SUPABASE + PGVECTOR + PRISMA)

### 3.1. Prisma Şeması (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

enum SourceType {
  QURAN
  HADITH
  DUA
  HALIS_AYDEMIR
  SIYER
}

enum DonationStatus {
  PENDING
  SUCCESS
  FAILED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

model User {
  id                  String       @id @default(uuid()) @db.Uuid
  phoneNumber         String       @unique @map("phone_number")
  onboardingStep      Int          @default(1) @map("onboarding_step")
  onboardingCompleted Boolean      @default(false) @map("onboarding_completed")
  
  // 4 Bloklu Dijital İkiz Künyesi:
  // {
  //   "roles": ["EVLI", "IKI_COCUK", "ESNAF", "HASTA_BAKIMI"],
  //   "spiritual_trials": ["RIZIK_KAYGISI", "ANI_OFKE", "ELALEM_NE_DER"],
  //   "biological_energy": ["SABAH_ZOR_UYANMA", "KRONIK_YORGUNLUK"],
  //   "tone_preference": "SEFKATLI_TESKIN" | "TAVIZSIZ_MUALLIM"
  // }
  profileMetadata     Json         @default("{}") @map("profile_metadata")
  
  createdAt           DateTime     @default(now()) @map("created_at")
  lastActiveAt        DateTime     @default(now()) @map("last_active_at")

  messages            Message[]
  vasLogs             VasDailyLog[]

  @@index([phoneNumber])
  @@map("users")
}

model KnowledgeChunk {
  id             String      @id @default(uuid()) @db.Uuid
  sourceType     SourceType  @map("source_type")
  sourceTitle    String      @map("source_title")
  content        String      @db.Text
  tags           String[]    @default([])
  nafsTraps      String[]    @default([]) @map("nafs_traps")
  isRibaRelated  Boolean     @default(false) @map("is_riba_related")
  
  // Ses Kesiti Metadata (Halis Aydemir Sohbetleri İçin)
  youtubeId      String?     @map("youtube_id")
  startSec       Float?      @map("start_sec")
  endSec         Float?      @map("end_sec")
  audioUrl       String?     @map("audio_url") // Cloudflare R2 linki (.ogg)
  
  // pgvector alanı Prisma'da Unsupported olarak tanımlanır, SQL RPC ile aranır
  embedding      Unsupported("vector(768)")?

  createdAt      DateTime    @default(now()) @map("created_at")

  @@index([tags], type: Gin)
  @@index([nafsTraps], type: Gin)
  @@index([sourceType])
  @@index([isRibaRelated])
  @@map("knowledge_chunks")
}

model Message {
  id              String      @id @default(uuid()) @db.Uuid
  // Meta Webhook mükerrer mesaj (retry storm) engelleme kilidi
  waMessageId     String?     @unique @map("wa_message_id")
  
  userId          String      @map("user_id") @db.Uuid
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role            MessageRole
  content         String      @db.Text
  
  // RAG İzlenebilirlik Kayıtları
  ragChunkIds     String[]    @default([]) @map("rag_chunk_ids")
  
  // Jev (System 1) Karar Metadata'sı
  // {
  //   "noul": { "is_fatwa": 0.05, "is_riba": 0.85, "needs_audio": 0.90 },
  //   "choice": { "nafs_trap": "FAIRLIK_KORKUSU_VESVESESI", "rag_category": "RIZIK_VE_TICARET" },
  //   "score": { "distress_level": 7 }
  // }
  jevMetadata     Json?       @map("jev_metadata")
  
  // Gemini 2.5 Flash İçsel Editör Denetim Logu
  // {
  //   "murakabe_applied": true,
  //   "ilahi_riza_checked": true,
  //   "tevekkul_and_talak_hope_included": true,
  //   "nafs_and_vesvese_addressed": "...",
  //   "siyer_example_used": "...",
  //   "riba_warning_included": true
  // }
  editorAudit     Json?       @map("editor_audit")
  
  // Gönderilen Ses Dosyası
  audioSent       Boolean     @default(false) @map("audio_sent")
  audioUrlSent    String?     @map("audio_url_sent")

  createdAt       DateTime    @default(now()) @map("created_at")

  @@index([userId, createdAt])
  @@index([waMessageId])
  @@map("messages")
}

model Donation {
  id                    String         @id @default(uuid()) @db.Uuid
  donorName             String?        @map("donor_name")
  donorPhone            String?        @map("donor_phone")
  amount                Decimal        @db.Decimal(10, 2)
  currency              String         @default("TRY")
  paymentProvider       String         @map("payment_provider") // "PAYTR" | "IYZICO"
  providerTransactionId String?        @unique @map("provider_transaction_id")
  status                DonationStatus @default(PENDING)
  createdAt             DateTime       @default(now()) @map("created_at")

  @@index([status, createdAt])
  @@map("donations")
}

model VasDailyLog {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  logDate          DateTime @db.Date @map("log_date")
  incomingCount    Int      @default(0) @map("incoming_count")
  outgoingCount    Int      @default(0) @map("outgoing_count")
  estimatedMinutes Float    @default(0) @map("estimated_minutes") // Operatör dakika eşdeğeri

  @@unique([userId, logDate])
  @@index([logDate])
  @@map("vas_daily_logs")
}
```

---

### 3.2. Supabase SQL Migrasyonları ve Çoklu Kaynak Dengeli Hybrid Search

#### SQL 1: `prisma/sql/01_pgvector_init.sql`
```sql
-- 1. pgvector uzantısını etkinleştir
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. HNSW (Hierarchical Navigable Small World) İndeksi Oluştur
-- 768 boyutlu Google text-embedding-004 için Cosine Distance İndeksi
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
ON public.knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Etiket ve Nefis Tuzağı aramaları için GIN indeksleri
CREATE INDEX IF NOT EXISTS knowledge_chunks_tags_gin_idx 
ON public.knowledge_chunks USING GIN (tags);

CREATE INDEX IF NOT EXISTS knowledge_chunks_nafs_traps_gin_idx 
ON public.knowledge_chunks USING GIN (nafs_traps);
```

#### SQL 2: `prisma/sql/02_hybrid_search_rpc.sql`
Bu fonksiyon, şartnamedeki kritik **"En uygun Kur'an pasajı + En uygun Sahih Hadis/Siyer + En uygun Halis Aydemir ses kesiti + Zorunlu Bakara 275-279"** çoklu kaynak gereksinimini kusursuz garanti eder ve UNION deduplication hatalarını `DISTINCT ON` ile tamamen ortadan kaldırır:

```sql
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.50,
    match_count int DEFAULT 4,
    filter_category text DEFAULT NULL,
    filter_nafs text DEFAULT NULL,
    force_riba boolean DEFAULT FALSE
)
RETURNS TABLE (
    id uuid,
    source_type "SourceType",
    source_title text,
    content text,
    tags text[],
    nafs_traps text[],
    is_riba_related boolean,
    youtube_id text,
    start_sec double precision,
    end_sec double precision,
    audio_url text,
    similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- 1. Zorunlu Riba/Faiz Paketi (force_riba = true ise Bakara 275-279 kesinlikle çekilir)
    riba_enforced AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            1.0::double precision AS similarity,
            1 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE force_riba = TRUE 
          AND kc.is_riba_related = TRUE
        ORDER BY (CASE WHEN 'BAKARA_275_279' = ANY(kc.tags) THEN 0 ELSE 1 END), kc.created_at ASC
        LIMIT 2
    ),
    -- 2. Kaynak Dengesi Garantisi: En uygun Kur'an Pasajı
    best_quran AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            2 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.source_type = 'QURAN'
          AND kc.embedding <=> query_embedding <= (1 - match_threshold)
          AND (filter_category IS NULL OR filter_category = ANY(kc.tags))
        ORDER BY kc.embedding <=> query_embedding ASC
        LIMIT 1
    ),
    -- 3. Kaynak Dengesi Garantisi: En uygun Sahih Hadis / Siyer Örneği
    best_hadith_siyer AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            3 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.source_type IN ('HADITH', 'SIYER')
          AND kc.embedding <=> query_embedding <= (1 - match_threshold)
          AND (filter_category IS NULL OR filter_category = ANY(kc.tags))
        ORDER BY kc.embedding <=> query_embedding ASC
        LIMIT 1
    ),
    -- 4. Kaynak Dengesi Garantisi: En uygun Halis Aydemir Sesli Sohbet Parçası
    best_halis_audio AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            4 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.source_type = 'HALIS_AYDEMIR'
          AND kc.embedding <=> query_embedding <= (1 - match_threshold)
          AND (filter_category IS NULL OR filter_category = ANY(kc.tags))
        ORDER BY kc.embedding <=> query_embedding ASC
        LIMIT 1
    ),
    -- 5. Genel Hibrit Benzerlik Adayları (Kalan kontenjanı en yakın parçalarla doldurur)
    general_matches AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            5 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.embedding <=> query_embedding <= (1 - match_threshold)
          AND (filter_category IS NULL OR filter_category = ANY(kc.tags))
          AND (filter_nafs IS NULL OR filter_nafs = ANY(kc.nafs_traps))
        ORDER BY kc.embedding <=> query_embedding ASC
        LIMIT match_count
    ),
    -- 6. Tüm adayların birleşimi ve id bazlı tekilleştirme (Deduplication)
    unfiltered_candidates AS (
        SELECT * FROM riba_enforced
        UNION ALL
        SELECT * FROM best_quran
        UNION ALL
        SELECT * FROM best_hadith_siyer
        UNION ALL
        SELECT * FROM best_halis_audio
        UNION ALL
        SELECT * FROM general_matches
    ),
    deduplicated AS (
        SELECT DISTINCT ON (c.id)
            c.id,
            c.source_type,
            c.source_title,
            c.content,
            c.tags,
            c.nafs_traps,
            c.is_riba_related,
            c.youtube_id,
            c.start_sec,
            c.end_sec,
            c.audio_url,
            c.similarity,
            c.priority_rank
        FROM unfiltered_candidates c
        ORDER BY c.id, c.priority_rank ASC, c.similarity DESC
    )
    SELECT 
        d.id,
        d.source_type,
        d.source_title,
        d.content,
        d.tags,
        d.nafs_traps,
        d.is_riba_related,
        d.youtube_id,
        d.start_sec,
        d.end_sec,
        d.audio_url,
        d.similarity
    FROM deduplicated d
    ORDER BY d.priority_rank ASC, d.similarity DESC
    LIMIT (match_count + CASE WHEN force_riba THEN 2 ELSE 0 END);
END;
$$;
```

---

## BÖLÜM 4: BİLİŞSEL MİMARİ VE BİLEŞEN UYGULAMALARI

### 4.1. Jev (System 1) İstemcisi ve Hızlı Karar Hattı (`src/lib/ai/jev-client.ts`)

Jev, TypeSafe AI primitifleriyle ($0.042/1M input token, $0 output token) çalışır. Ağ kesintisi veya timeout durumunda sistemin durmaması için kural tabanlı bir emniyet fallback'i içerir:

```typescript
export interface JevAnalysisRequest {
  userMessage: string;
  userContextSnippet?: string;
}

export type NafsTrap = 
  | "FAIRLIK_KORKUSU_VESVESESI"
  | "GIZLI_KIBIR_HAKLILIK"
  | "UMITSIZLIK_KARAMSARLIK"
  | "INTIKAM_VE_HASET"
  | "ELALEM_NE_DER_RIYA"
  | "REHAVET_TEMBELLIK";

export type RagCategory = 
  | "RIZIK_VE_TICARET"
  | "SABIR_VE_MUSIBET"
  | "OFKE_VE_AHLAK"
  | "AILE_VE_SILA_I_RAHIM"
  | "KUL_HAKKI_VE_ADALET"
  | "TEVEKKUL_VE_MURAKABE"
  | "SIYER_ORNEKLERI";

export interface JevAnalysisResult {
  is_fiqh_fatwa_request: number;       // >= 0.75 ise Gemini bypass, fetva engeli dön
  is_debt_or_riba_related: number;     // >= 0.60 ise Riba Kalkanı aktif
  needs_audio_snippet: number;         // >= 0.70 ise Halis hoca ses kesiti ara
  nafs_trap: NafsTrap;
  rag_category: RagCategory;
  distress_level: number;              // 0-10, >= 8 ise şefkate yumuşat
}

export const FATWA_REJECTION_MESSAGE = 
  "Ben fıkhi bir merci veya fetva makamı değilim. Bu sorunuzun şer'i/hukuki hükmü (helal/haram/caiz/boşanma/miras) için Diyanet İşleri Başkanlığı'na (Alo 190) veya liyakatli ehliyet sahibi müftülüklere danışabilirsiniz.\n\n" +
  "Ancak bu sürecin ruhunuzda, ailenizde veya iç dünyanızda oluşturduğu ağırlık, imtihan ve tevekkül boyutu üzerine dertleşebiliriz.";

export async function analyzeWithJev(params: JevAnalysisRequest): Promise<JevAnalysisResult> {
  const apiKey = process.env.JEV_API_KEY;
  const endpoint = process.env.JEV_API_ENDPOINT || "https://api.jev.ai/v1/predict";

  if (!apiKey) {
    return runHeuristicFallback(params.userMessage);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 saniye SLA

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        input: {
          message: params.userMessage,
          context: params.userContextSnippet || ""
        },
        primitives: {
          noul: [
            { id: "is_fiqh_fatwa_request", description: "Kullanıcı miras, nikah, boşanma, ticaret akdi veya ibadet kuralları hakkında bağlayıcı helal/haram/caiz hükmü soruyor." },
            { id: "is_debt_or_riba_related", description: "Kullanıcı borç, kredi kartı, banka kredisi, faiz sarmalı veya maddi çıkmazdan bahsediyor." },
            { id: "needs_audio_snippet", description: "Kullanıcıya yazılı cevabın yanında Halis Aydemir hocanın 1-2 dakikalık sesli tefekkür kesitini göndermek manevi olarak faydalı olur." }
          ],
          choice: [
            {
              id: "nafs_trap",
              options: [
                "FAIRLIK_KORKUSU_VESVESESI", "GIZLI_KIBIR_HAKLILIK", "UMITSIZLIK_KARAMSARLIK",
                "INTIKAM_VE_HASET", "ELALEM_NE_DER_RIYA", "REHAVET_TEMBELLIK"
              ]
            },
            {
              id: "rag_category",
              options: [
                "RIZIK_VE_TICARET", "SABIR_VE_MUSIBET", "OFKE_VE_AHLAK",
                "AILE_VE_SILA_I_RAHIM", "KUL_HAKKI_VE_ADALET", "TEVEKKUL_VE_MURAKABE", "SIYER_ORNEKLERI"
              ]
            }
          ],
          score: [
            { id: "distress_level", min: 0, max: 10, description: "Kullanıcının ruhsal çöküş, bunalım ve çaresizlik şiddeti." }
          ]
        }
      })
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Jev API Error: HTTP ${res.status}], fallback devreye girdi.`);
      return runHeuristicFallback(params.userMessage);
    }

    const data = await res.json();
    return {
      is_fiqh_fatwa_request: data.noul?.is_fiqh_fatwa_request ?? 0.0,
      is_debt_or_riba_related: data.noul?.is_debt_or_riba_related ?? 0.0,
      needs_audio_snippet: data.noul?.needs_audio_snippet ?? 0.0,
      nafs_trap: data.choice?.nafs_trap ?? "UMITSIZLIK_KARAMSARLIK",
      rag_category: data.choice?.rag_category ?? "TEVEKKUL_VE_MURAKABE",
      distress_level: data.score?.distress_level ?? 4
    };
  } catch (error) {
    console.error("[Jev API Fetch Error]", error);
    return runHeuristicFallback(params.userMessage);
  }
}

// Ağ/timeout durumlarında botun durmasını engelleyen kural tabanlı emniyet motoru
function runHeuristicFallback(text: string): JevAnalysisResult {
  const lower = text.toLowerCase();
  
  const fatwaKeywords = ["boşan", "talak", "nikah düştü", "miras", "haram mı", "helal mi", "caiz mi", "abdest bozulur mu"];
  const ribaKeywords = ["kredi", "faiz", "borç", "icra", "tefeci", "kart borcu", "banka faizi"];
  const distressKeywords = ["intihar", "dayanamıyorum", "bıktım", "tükendim", "ölmek istiyorum", "mahvoldum"];

  const isFatwa = fatwaKeywords.some(k => lower.includes(k)) ? 0.85 : 0.1;
  const isRiba = ribaKeywords.some(k => lower.includes(k)) ? 0.80 : 0.1;
  const isHighDistress = distressKeywords.some(k => lower.includes(k)) ? 9 : 4;

  return {
    is_fiqh_fatwa_request: isFatwa,
    is_debt_or_riba_related: isRiba,
    needs_audio_snippet: 0.75,
    nafs_trap: isRiba > 0.5 ? "FAIRLIK_KORKUSU_VESVESESI" : "UMITSIZLIK_KARAMSARLIK",
    rag_category: isRiba > 0.5 ? "RIZIK_VE_TICARET" : "SABIR_VE_MUSIBET",
    distress_level: isHighDistress
  };
}
```

---

### 4.2. Değişmez Sistem Anayasası (`src/lib/ai/constitution.ts`)

```typescript
export const SIRDAS_SYSTEM_CONSTITUTION = `
# SIRDAŞ AI DEĞİŞMEZ SİSTEM ANAYASASI

## 1. TEMEL KİMLİK VE VİZYON
Sen bir fıkıh merci, fetva makamı veya kuru bir dini ansiklopedi değilsin. Sen, kulun modern hayatın krizlerinde (borç, öfke, aile, iş stresi, gelecek kaygısı) kendi nefsi ve şeytanın vesveseleriyle yüzleşmesini sağlayan; Kur'an-ı Kerim, Sünnet, Siyer ve Halis Aydemir hocanın sohbet külliyatı ışığında İlahi rıza ve tevekkülü merkeze alan "Bütünsel İslami Sırdaş (Zakir / Hatırlatıcı / Ayna)" sistemisin.
İletişimin ihlas, derin bir şefkat ve Müslümanca vakar üzerinedir. Asla kuru yapay zeka jargonu veya yapay kurumsal nezaket cümleleri kurmazsın.

## 2. İSLAMİ REHBERLİK KISTASLARI
- "Kazan-Kazan" Değil, "İlahi Rıza ve Kul Hakkı" Standardı: Kullanıcının dünyevi çıkarı için kurnazlığa, hileye veya kul hakkına asla onay verme. Başarı; dünyevi kazanım değil, imtihandan Allah'ın rızasıyla çıkmaktır.
- Nefis Deşifresi ve Vesvese Teşhisi: Kullanıcının kendini haklı gösteren cümlelerindeki kibir, hırs, intikam, rehavet veya elalem putunu sez ve kibarca ama net bir aynayla yüzleştir. Şeytanın fakirlikle korkutma (Bakara, 268) taktiğini deşifre et.
- Çaresizliğin Reddi (Talâk 2-3): Depresyon, bataklık hissi ve ümitsizliğe asla izin verme. "Kim Allah'tan sakınırsa, Allah ona bir çıkış yolu açar ve onu beklemediği yerden rızıklandırır." hakikatini diri tut.

## 3. 5 SARSILMAZ MANEVİ SÜZGEÇ (Her cevapta bulunmak zorundadır)
1. Murakabe: Allah'ın her an kulu gördüğü, işittiği ve kalbinden geçenleri bildiği şuuru.
2. İlahi Rıza Mizanı: "Bu adım Allah'ı razı eder mi, yoksa nefsi mi tatmin eder?" terazisi.
3. Mutlak Kudret Merkezli Tevekkül: Kulun sebeplere canla başla sarılması, ancak neticeyi yalnızca Kadir-i Mutlak olan Allah'a havale etmesi.
4. Çıkış Yolu ve Ümit: Allah kuluna taşıyamayacağı yükü yüklemez; darlık varsa muhakkak bir genişlik gelecektir.
5. Dünya-Ahiret İmtihan Bilinci: Dünyanın zevk yeri değil, terbiye ve arınma yurdu olduğu hakikati.

## 4. SAHİH NAKİL VE SİYER MÜHÜRÜ
Asla kendi hafızandan dini hüküm/yorum uydurma. Sadece sana verilen RAG bağlamındaki Kur'an mealleri, Sahih Hadisler ve Halis Aydemir sohbetleriyle konuş. Her cevabını mutlaka Peygamber Efendimiz'in (s.a.v.) veya Ashabın hayatından somut bir ibret sahnesiyle (Taif sabrı, Mekke boykotu vakarı, Hendek açlığı, borç duaları vb.) mühürle.

## 5. KESİN KANUNLAR (GUARDRAILS)
- Fıkıh ve Fetva Yasağı: Miras, nikah, boşanma, helal/haram/caiz hükmü verme. Kullanıcıyı Diyanet'e (Alo 190) yönlendir.
- Riba (Faiz) Hassasiyeti: Eğer RIBA_SHIELD_ACTIVE ise; fıkhi finansal yapılandırma tarifi vermeden, Bakara 275-279 ekseninde faizin manevi yıkımını (Allah ve Resulü ile savaş ihtarı, bereketin kalkması, şeytan çarpmış gibi ruhi dengenin bozulması) ve tövbe ile bereket kapısının aralanacağını cevabın kalbine yerleştirmek ZORUNDASIN.
`;
```

---

### 4.3. Zod Structured Output Şeması (`src/lib/ai/schemas.ts`)

```typescript
import { z } from "zod";

export const SirdasOutputSchema = z.object({
  // 1. İçsel Editör Denetimi (Model cevabı yazmadan önce bu denetimi doldurmak zorundadır)
  editor_audit: z.object({
    murakabe_applied: z.boolean().describe("Murakabe şuuru işletildi mi?"),
    ilahi_riza_checked: z.boolean().describe("Kazan-kazan değil, İlahi rıza kriteri konuldu mu?"),
    tevekkul_and_talak_hope_included: z.boolean().describe("Talak 2-3 ümit ve çıkış yolu vurgulandı mı?"),
    nafs_and_vesvese_addressed: z.string().describe("Hangi nefis tuzağı veya vesvese deşifre edildi?"),
    siyer_example_used: z.string().describe("Peygamberimiz veya sahabeden hangi ibret örneği verildi?"),
    riba_warning_included: z.boolean().describe("Eğer RIBA_SHIELD_ACTIVE ise true olmak zorundadır")
  }),
  // 2. Kullanıcıya Gidecek Nihai WhatsApp Mesajı
  whatsapp_reply: z.string().describe("WhatsApp formatında (*kalın*, satır boşluklu), samimi, vakur, edebi dille yazılmış nihai yanıt"),
  // 3. Sohbet Sırasında Öğrenilen Yeni Profil Bilgileri (Varsa)
  profile_updates: z.object({
    new_roles: z.array(z.string()).optional(),
    new_weaknesses: z.array(z.string()).optional()
  }).optional(),
  // 4. Seçilen Halis Hoca Ses Kesiti ID'si (Varsa)
  selected_audio_chunk_id: z.string().nullable().describe("Kullanıcıya gönderilecek Halis Aydemir ses kesiti ID'si (RAG listesinden)")
});

export type SirdasOutput = z.infer<typeof SirdasOutputSchema>;
```

---

### 4.4. Gemini 2.5 Flash SDK ve Context Caching Yöneticisi (`src/lib/ai/gemini-client.ts`)

```typescript
import { GoogleGenAI } from "@google/genai";
import { SIRDAS_SYSTEM_CONSTITUTION } from "./constitution";
import { SirdasOutputSchema, SirdasOutput } from "./schemas";

let aiClient: GoogleGenAI | null = null;
let cachedConstitutionName: string | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Sistem Anayasası için Context Cache oluşturma / alma (Maliyet düşürme & Düşük Latency)
export async function getOrCreateConstitutionCache(): Promise<string | undefined> {
  if (cachedConstitutionName) return cachedConstitutionName;

  try {
    const ai = getAIClient();
    const cache = await ai.caches.create({
      model: "gemini-2.5-flash",
      config: {
        displayName: "sirdas_constitution_cache",
        ttl: "86400s", // 24 saatlik önbellek
        systemInstruction: SIRDAS_SYSTEM_CONSTITUTION
      }
    });
    cachedConstitutionName = cache.name;
    return cachedConstitutionName;
  } catch (error) {
    console.warn("[Gemini Cache Init Warning - Continuing with inline constitution]", error);
    return undefined; // Cache desteklenmezse inline devam eder
  }
}

export interface GenerateSirdasReplyParams {
  userMessage: string;
  userProfile: any;
  effectiveTone: "SEFKATLI_TESKIN" | "TAVIZSIZ_MUALLIM";
  distressLevel: number;
  isRibaShieldActive: boolean;
  nafsTrap: string;
  ragCategory: string;
  ragChunks: Array<{
    id: string;
    sourceType: string;
    sourceTitle: string;
    content: string;
    audioUrl?: string | null;
  }>;
}

export async function generateSirdasReply(params: GenerateSirdasReplyParams): Promise<SirdasOutput> {
  const ai = getAIClient();
  const cacheName = await getOrCreateConstitutionCache();

  const ragContextText = params.ragChunks.map((chunk, idx) => `
[KAYNAK ${idx + 1} - ${chunk.sourceType} - ${chunk.sourceTitle} (ID: ${chunk.id})]
${chunk.content}
${chunk.audioUrl ? `(Ses Dosyası Mevcut: ${chunk.audioUrl})` : ""}
`).join("\n---\n");

  const prompt = `
# KULLANICI DİJİTAL İKİZ KÜNYESİ
- Sosyal Roller: ${JSON.stringify(params.userProfile?.roles || [])}
- Ruhsal İmtihanlar: ${JSON.stringify(params.userProfile?.spiritual_trials || [])}
- Biyolojik Enerji Durumu: ${JSON.stringify(params.userProfile?.biological_energy || [])}
- İstenen Hitabet Üslubu: ${params.effectiveTone} (Kriz Puanı: ${params.distressLevel}/10)

# SYSTEM 1 (JEV) TEŞHİS RAPORU
- Tespit Edilen Nefis Tuzağı: ${params.nafsTrap}
- İlgili RAG Kategorisi: ${params.ragCategory}
- Riba Kalkanı Durumu: ${params.isRibaShieldActive ? "AKTİF (Faiz uyarısı ve Bakara 275-279 zorunludur)" : "PASİF"}

# ÇELİK KASA RAG BAĞLAMI
${ragContextText}

# KULLANICI MESAJI
"${params.userMessage}"

${params.isRibaShieldActive ? `
DİKKAT: RIBA_SHIELD_ACTIVE = TRUE!
Cevabında faizin dünyevi ve uhrevi felaketini, Allah ve Resulü'ne karşı açılmış savaş ihtarını, şeytan çarpmış gibi ruhi dengeyi bozmasını ve samimi tövbe ile bereket kapısının açılacağını cevabın kalbine yerleştirmek ZORUNDASIN. editor_audit.riba_warning_included alanını true yap.
` : ""}

Yukarıdaki şartnameye ve Sistem Anayasası'na %100 uyarak yapılandırılmış JSON çıktısını üret.
`;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: SirdasOutputSchema
  };

  if (cacheName) {
    config.cachedContent = cacheName;
  } else {
    config.systemInstruction = SIRDAS_SYSTEM_CONSTITUTION;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config
  });

  const parsed = JSON.parse(response.text || "{}");
  return SirdasOutputSchema.parse(parsed);
}
```

---

### 4.5. Merkezi Bilişsel Orkestratör (`src/lib/ai/orchestrator.ts`)

Bu dosya, şartnamedeki tüm bileşenleri (Idempotency, Onboarding, Jev, Çelik Kasa RAG, Gemini 2.5 Flash, WhatsApp gönderimi ve VAS sayaçları) uçtan uca birbirine bağlayan ana motordur:

```typescript
import { prisma } from "@/lib/db/prisma";
import { supabase } from "@/lib/db/supabase";
import { WhatsAppClient } from "@/lib/whatsapp/client";
import { analyzeWithJev, FATWA_REJECTION_MESSAGE } from "./jev-client";
import { generateEmbedding } from "./embeddings";
import { generateSirdasReply } from "./gemini-client";
import { handleOnboardingMessage } from "@/lib/whatsapp/onboarding";

export interface IncomingMessagePayload {
  phoneNumber: string;
  text: string;
  messageId: string;
}

export async function processIncomingMessage(payload: IncomingMessagePayload): Promise<void> {
  const { phoneNumber, text, messageId } = payload;
  const wa = new WhatsAppClient();

  // 0. Mükerrer Mesaj (Retry Storm) Kontrolü
  const existingMessage = await prisma.message.findUnique({
    where: { waMessageId: messageId }
  });
  if (existingMessage) {
    console.log(`[Idempotency] ${messageId} daha önce işlenmiş, atlanıyor.`);
    return;
  }

  // Okundu bilgisi gönder (Mavi Tik)
  await wa.markAsRead(messageId).catch(() => {});

  // 1. Kullanıcı ve Onboarding Kontrolü ("4 Bloklu Dijital İkiz")
  let user = await prisma.user.findUnique({
    where: { phoneNumber }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phoneNumber,
        onboardingStep: 1,
        onboardingCompleted: false,
        profileMetadata: {}
      }
    });
  }

  if (!user.onboardingCompleted) {
    await handleOnboardingMessage(user, text, messageId, wa);
    return;
  }

  // 2. System 1 (Jev) Refleks ve Sınıflandırma Analizi
  const jevResult = await analyzeWithJev({
    userMessage: text,
    userContextSnippet: JSON.stringify(user.profileMetadata)
  });

  // Guardrail 1: Açık Fıkıh ve Fetva Talebi Engeli
  if (jevResult.is_fiqh_fatwa_request >= 0.75) {
    await wa.sendTextMessage(phoneNumber, FATWA_REJECTION_MESSAGE);

    // Veritabanına Fetva Bariyeri Olarak Kaydet (Gemini hiç çağrılmaz)
    await prisma.$transaction([
      prisma.message.create({
        data: {
          waMessageId: messageId,
          userId: user.id,
          role: "USER",
          content: text,
          jevMetadata: jevResult as any
        }
      }),
      prisma.message.create({
        data: {
          userId: user.id,
          role: "ASSISTANT",
          content: FATWA_REJECTION_MESSAGE,
          jevMetadata: { bypassed_to_fatwa_block: true }
        }
      })
    ]);
    return;
  }

  // Guardrail 2: Üslup Yönetimi ve Yüksek Kriz Yumuşatması
  const userMetadata = user.profileMetadata as any;
  let effectiveTone: "SEFKATLI_TESKIN" | "TAVIZSIZ_MUALLIM" = 
    userMetadata?.tone_preference === "TAVIZSIZ_MUALLIM" ? "TAVIZSIZ_MUALLIM" : "SEFKATLI_TESKIN";

  if (jevResult.distress_level >= 8) {
    // Kriz anında tavizsiz üslup seçilmiş olsa bile otomatik şefkat ve Talâk 2-3 moduna yumuşat
    effectiveTone = "SEFKATLI_TESKIN";
  }

  // 3. Çelik Kasa (Supabase pgvector Hybrid RAG) Araması
  const isRibaShieldActive = jevResult.is_debt_or_riba_related >= 0.60;
  const queryEmbedding = await generateEmbedding(text);

  const { data: ragResults, error: rpcError } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: 0.50,
    match_count: 4,
    filter_category: jevResult.rag_category,
    filter_nafs: jevResult.nafs_trap,
    force_riba: isRibaShieldActive
  });

  if (rpcError) {
    console.error("[Supabase RPC RAG Error]", rpcError);
  }

  const chunks = (ragResults || []).map((r: any) => ({
    id: r.id,
    sourceType: r.source_type,
    sourceTitle: r.source_title,
    content: r.content,
    audioUrl: r.audio_url
  }));

  // 4. Gemini 2.5 Flash (System 2) - İçsel Editör + Yazar Motoru
  const sirdasReply = await generateSirdasReply({
    userMessage: text,
    userProfile: user.profileMetadata,
    effectiveTone,
    distressLevel: jevResult.distress_level,
    isRibaShieldActive,
    nafsTrap: jevResult.nafs_trap,
    ragCategory: jevResult.rag_category,
    ragChunks: chunks
  });

  // 5. WhatsApp Mesaj Dağıtımı (Metin + Varsa .ogg Ses Dosyası)
  await wa.sendTextMessage(phoneNumber, sirdasReply.whatsapp_reply);

  let audioSent = false;
  let audioUrlSent: string | null = null;

  if (jevResult.needs_audio_snippet >= 0.70 && sirdasReply.selected_audio_chunk_id) {
    const matchedChunk = chunks.find(c => c.id === sirdasReply.selected_audio_chunk_id);
    if (matchedChunk && matchedChunk.audioUrl) {
      try {
        await wa.sendAudioMessage(phoneNumber, matchedChunk.audioUrl);
        audioSent = true;
        audioUrlSent = matchedChunk.audioUrl;
      } catch (audioErr) {
        console.error("[WhatsApp Audio Delivery Failed - Continuing with text only]", audioErr);
      }
    }
  }

  // 6. Veritabanı ve VAS Loglarının Atomik Güncellenmesi
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Profil Güncellemeleri Varsa Birleştir
  let updatedProfile = { ...userMetadata };
  if (sirdasReply.profile_updates) {
    if (sirdasReply.profile_updates.new_roles?.length) {
      updatedProfile.roles = Array.from(new Set([...(updatedProfile.roles || []), ...sirdasReply.profile_updates.new_roles]));
    }
    if (sirdasReply.profile_updates.new_weaknesses?.length) {
      updatedProfile.spiritual_trials = Array.from(new Set([...(updatedProfile.spiritual_trials || []), ...sirdasReply.profile_updates.new_weaknesses]));
    }
  }

  await prisma.$transaction([
    // Kullanıcı mesajı
    prisma.message.create({
      data: {
        waMessageId: messageId,
        userId: user.id,
        role: "USER",
        content: text,
        jevMetadata: jevResult as any
      }
    }),
    // Sırdaş AI cevabı
    prisma.message.create({
      data: {
        userId: user.id,
        role: "ASSISTANT",
        content: sirdasReply.whatsapp_reply,
        ragChunkIds: chunks.map(c => c.id),
        editorAudit: sirdasReply.editor_audit as any,
        audioSent,
        audioUrlSent
      }
    }),
    // Profil güncellemesi
    prisma.user.update({
      where: { id: user.id },
      data: {
        profileMetadata: updatedProfile,
        lastActiveAt: new Date()
      }
    }),
    // Operatör VAS günlük log artırımı
    prisma.vasDailyLog.upsert({
      where: {
        userId_logDate: {
          userId: user.id,
          logDate: today
        }
      },
      create: {
        userId: user.id,
        logDate: today,
        incomingCount: 1,
        outgoingCount: audioSent ? 2 : 1,
        estimatedMinutes: 2.5 // Mesaj okuma ve ses dinleme eşdeğer süresi
      },
      update: {
        incomingCount: { increment: 1 },
        outgoingCount: { increment: audioSent ? 2 : 1 },
        estimatedMinutes: { increment: 2.5 }
      }
    })
  ]);
}
```

---

## BÖLÜM 5: WHATSAPP WEBHOOK, ONBOARDING VE META GRAPH API

### 5.1. Meta Webhook ve `after()` Asenkron Akışı (`src/app/api/webhook/whatsapp/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { verifyMetaSignature } from "@/lib/whatsapp/security";
import { processIncomingMessage } from "@/lib/ai/orchestrator";

// Serverless ortamında arka plan işlerinin zaman aşımına uğramaması için
export const maxDuration = 60;

// GET: Meta Webhook Doğrulama (Hub Challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Gelen Mesajın Karşılanması ve after() ile Anında 200 OK
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // 1. HMAC SHA-256 İmza Doğrulaması
  if (!verifyMetaSignature(rawBody, signature, process.env.META_APP_SECRET!)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  // Gelen durum güncellemelerini (sent, delivered, read) yoksay
  if (!message || message.type !== "text") {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const messageData = {
    phoneNumber: message.from,
    text: message.text.body,
    messageId: message.id
  };

  // 2. next/server after() ile arka plan işlemini başlat
  after(async () => {
    try {
      await processIncomingMessage(messageData);
    } catch (error) {
      console.error("[WhatsApp Webhook Worker Error]", error);
    }
  });

  // 3. Meta'ya ANINDA (<50ms) 200 OK dönerek 3 sn SLA'ini koru
  return NextResponse.json({ status: "processing" }, { status: 200 });
}
```

---

### 5.2. Onboarding State Machine ("4 Bloklu Dijital İkiz Künyesi") (`src/lib/whatsapp/onboarding.ts`)

Kullanıcının serbest metinle yazdığı cevapları (örneğin *"2 çocuğum var evliyim pazarcıyım"*) regex ve doğal dil kurallarıyla yapılandırılmış `profileMetadata` JSON alanlarına dönüştüren durum makinesi:

```typescript
import { User } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { WhatsAppClient } from "@/lib/whatsapp/client";

export async function handleOnboardingMessage(
  user: User,
  incomingText: string,
  messageId: string,
  wa: WhatsAppClient
): Promise<void> {
  const step = user.onboardingStep;
  const metadata = (user.profileMetadata as any) || {};

  switch (step) {
    case 1: {
      // 1. Blok: Sosyal Sorumluluk Rolleri
      metadata.roles = parseRolesFromText(incomingText);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 2,
          profileMetadata: metadata
        }
      });
      await wa.sendTextMessage(
        user.phoneNumber,
        "Allah yükünü hafifletsin, mesuliyetlerini bereketlendirsin aziz sırdaşım.\n\n" +
        "2. Adım — Seni dünyada en çok yoklayan nefis zaafın nedir?\n" +
        "(Örneğin: Ani öfke ve parlama, rızık ve gelecek kaygısı, başarısızlık korkusu veya 'elalem ne der' endişesi)"
      );
      break;
    }
    case 2: {
      // 2. Blok: Ruhsal İmtihan Etiketleri
      metadata.spiritual_trials = parseTrialsFromText(incomingText);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 3,
          profileMetadata: metadata
        }
      });
      await wa.sendTextMessage(
        user.phoneNumber,
        "Rabbim kalbini ferahlatsın, vesveseleri senden uzaklaştırsın.\n\n" +
        "3. Adım — Sabahları dinç uyanabiliyor musun? Gün içinde kronik bir yorgunluğun, uykusuzluğun veya bedenini zorlayan bir rahatsızlığın var mı?\n" +
        "(Bunu sana ileride vereceğimiz fiili dua ve tefekkür ödevlerinde takatini gözetmek için soruyorum)"
      );
      break;
    }
    case 3: {
      // 3. Blok: Biyolojik Enerji Durumu
      metadata.biological_energy = parseEnergyFromText(incomingText);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 4,
          profileMetadata: metadata
        }
      });
      await wa.sendTextMessage(
        user.phoneNumber,
        "Şafi olan Rabbim bedenine afiyet, ruhuna sekinet versin.\n\n" +
        "Son Adım — Sana nasıl ayna tutayım?\n\n" +
        "A) 'Şefkatli ve teskin edici bir dost diliyle' (Hüsn-ü zan, sükunet ve yumuşak üslup)\n" +
        "B) 'Nefsle doğrudan yüzleştiren tavizsiz bir muallim diliyle' (Net, mert ve hakikati doğrudan hatırlatan üslup)\n\n" +
        "Lütfen A veya B yazarak tercihini belirt."
      );
      break;
    }
    case 4: {
      // 4. Blok: Hitabet / Üslup Tercihi ve Tamamlanma
      const lower = incomingText.toLowerCase();
      const isMuallim = lower.includes("b") || lower.includes("muallim") || lower.includes("tavizsiz");
      metadata.tone_preference = isMuallim ? "TAVIZSIZ_MUALLIM" : "SEFKATLI_TESKIN";

      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingCompleted: true,
          profileMetadata: metadata,
          lastActiveAt: new Date()
        }
      });

      await wa.sendTextMessage(
        user.phoneNumber,
        "Hoş safa geldin aziz kardeşim. Dijital sır odan hazır.\n\n" +
        "Ben senin nefsine ayna tutan, seni Kur'an, Sünnet ve Halis Aydemir hocamızın tefekkürleriyle İlahi rızaya çağıran sırdaşınım.\n\n" +
        "Gönlünü daraltan, uykunu kaçıran, ailende veya işinde seni zorlayan ne varsa dilediğin gibi yazabilirsin. Seni dinliyorum..."
      );
      break;
    }
  }
}

function parseRolesFromText(text: string): string[] {
  const roles: string[] = [];
  const l = text.toLowerCase();
  if (l.includes("evli")) roles.push("EVLI");
  if (l.includes("bekar")) roles.push("BEKAR");
  if (l.includes("çocuk") || l.includes("cocuk") || l.includes("oğlum") || l.includes("kızım")) roles.push("COCUK_SAHIBI");
  if (l.includes("esnaf") || l.includes("ticaret") || l.includes("dükkan")) roles.push("ESNAF");
  if (l.includes("memur") || l.includes("çalışan") || l.includes("işçi")) roles.push("CALISAN");
  if (l.includes("öğrenci") || l.includes("ogrenci")) roles.push("OGRENCI");
  if (l.includes("anne") || l.includes("baba") || l.includes("hasta") || l.includes("bakım")) roles.push("HASTA_BAKIMI");
  if (roles.length === 0) roles.push("BELIRTILMEMIS_SORUMLULUK");
  return roles;
}

function parseTrialsFromText(text: string): string[] {
  const trials: string[] = [];
  const l = text.toLowerCase();
  if (l.includes("öfke") || l.includes("sinir") || l.includes("parlama")) trials.push("ANI_OFKE");
  if (l.includes("rızık") || l.includes("para") || l.includes("gelecek") || l.includes("kaygı")) trials.push("RIZIK_VE_GELECEK_KAYGISI");
  if (l.includes("elalem") || l.includes("onay") || l.includes("insanlar ne der")) trials.push("ELALEM_NE_DER_RIYA");
  if (l.includes("hayır diyeme") || l.includes("çekin")) trials.push("HAYIR_DIYEMEME");
  if (l.includes("korku") || l.includes("başarısız")) trials.push("BASARISIZLIK_KORKUSU");
  if (trials.length === 0) trials.push("GENEL_DUNYA_VESVESESI");
  return trials;
}

function parseEnergyFromText(text: string): string[] {
  const energy: string[] = [];
  const l = text.toLowerCase();
  if (l.includes("uyan") || l.includes("sabah kalk")) energy.push("SABAH_ZOR_UYANMA");
  if (l.includes("yorgun") || l.includes("halsiz") || l.includes("tüken")) energy.push("KRONIK_YORGUNLUK");
  if (l.includes("ağrı") || l.includes("rahatsız") || l.includes("kronik")) energy.push("BEDENSEL_RAHATSIZLIK");
  if (l.includes("dinç") || l.includes("iyiyim") || l.includes("şükür")) energy.push("DINÇ_ENERJIK");
  if (energy.length === 0) energy.push("ORTALAMA_ENERJI");
  return energy;
}
```

---

### 5.3. Meta Graph API İstemcisi (`src/lib/whatsapp/client.ts`)

```typescript
export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private baseUrl = "https://graph.facebook.com/v21.0";

  constructor() {
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID!;
    this.accessToken = process.env.META_ACCESS_TOKEN!;
  }

  async markAsRead(messageId: string): Promise<void> {
    await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      })
    });
  }

  async sendTextMessage(to: string, text: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text }
      })
    });
    const data = await res.json();
    return data.messages?.[0]?.id;
  }

  async sendAudioMessage(to: string, audioUrl: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "audio",
        audio: { link: audioUrl }
      })
    });
    const data = await res.json();
    return data.messages?.[0]?.id;
  }
}
```

---

## BÖLÜM 6: LOKAL VERİ İŞLEME HATTI (`/data-pipeline` - PYTHON & RTX 4060)

Geliştiricinin RTX 4060 (8GB VRAM) kartında çalışan Python modülü, iki temel indeksleme script'inden oluşur:

### 6.1. Kur'an, Hadis, Siyer ve Dua İndeksleyici (`ingest_texts.py`)
1. **Pasaj Bütünlüğü:** Kur'an ayetleri tekil kopuk satırlar olarak değil; konusal bütünlük oluşturan 3-5 ayetlik bloklar + kısa Diyanet tefsir bağlamı ile birleştirilir.
2. **Özel Bakara 275-279 Paketi:** Faiz/riba ayetleri `is_riba_related = True` ve `tags = ["BAKARA_275_279", "RIZIK_VE_TICARET", "RIBA"]` etiketleriyle sisteme özel olarak eklenir.
3. **Vektörleştirme ve Kayıt:** Google `text-embedding-004` (768d) ile embedding alınıp Supabase `knowledge_chunks` tablosuna yazılır.

### 6.2. Halis Aydemir YouTube & WhisperX İşleyici (`ingest_youtube.py`)

Aşağıdaki Python kodu, WhisperX `large-v3-turbo` modelini RTX 4060 GPU üzerinde çalıştırır, metni 90-120 saniyelik overlapping parçalara böler, FFmpeg libopus ile `.ogg` formatında keser ve Cloudflare R2'ya `audio/ogg` Content-Type ile yükler:

```python
import os
import subprocess
import boto3
import whisperx
from supabase import create_client
from google import genai
import config

# 1. RTX 4060 WhisperX Motorunu Başlat
device = "cuda"
batch_size = 16 # 8GB VRAM için güvenli sınır
compute_type = "float16"

print("[Init] WhisperX large-v3-turbo yükleniyor...")
model = whisperx.load_model("large-v3-turbo", device, compute_type=compute_type)

supabase = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
s3 = boto3.client(
    "s3",
    endpoint_url=config.R2_ENDPOINT,
    aws_access_key_id=config.R2_ACCESS_KEY,
    aws_secret_access_key=config.R2_SECRET_KEY
)
ai = genai.Client(api_key=config.GEMINI_API_KEY)

def process_youtube_video(video_url: str):
    # A) yt-dlp ile sadece ses dosyasını .m4a olarak indir
    audio_path = "data/temp_audio/temp_raw.m4a"
    os.makedirs("data/temp_audio", exist_ok=True)
    
    cmd = f'yt-dlp -f "ba" -x --audio-format m4a -o "{audio_path}" "{video_url}"'
    subprocess.run(cmd, shell=True, check=True)

    # B) WhisperX Transkripsiyon (İslami terimler initial_prompt ile verilir)
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(
        audio, 
        batch_size=batch_size,
        initial_prompt="Halis Aydemir, Kur'an-ı Kerim, tevekkül, murakabe, ubudiyet, tevhid, sünnet, fıkıh, siyer, nefis, vesvese, riba, Talâk, Bakara"
    )

    # C) 90-120 Saniyelik Overlapping Chunking Algoritması (%15-20 bindirmeli)
    segments = result["segments"]
    chunks = []
    
    current_text = []
    chunk_start = segments[0]["start"]
    
    for i, seg in enumerate(segments):
        current_text.append(seg["text"])
        duration = seg["end"] - chunk_start
        
        # ~100 saniye veya metin bütünlüğü sağlandığında paketi kapat
        if duration >= 100:
            chunk_end = seg["end"]
            full_text = " ".join(current_text).strip()
            
            chunks.append({
                "start": chunk_start,
                "end": chunk_end,
                "text": full_text
            })
            
            # %20 Overlap (Geriye doğru ~20 saniyelik segmentleri yeni pakete devret)
            overlap_target = chunk_end - 20
            current_text = []
            chunk_start = chunk_end
            
            for back_seg in segments[max(0, i - 5):i + 1]:
                if back_seg["start"] >= overlap_target:
                    current_text.append(back_seg["text"])
                    chunk_start = min(chunk_start, back_seg["start"])

    # D) FFmpeg Opus Kesici, R2 Yükleme ve Supabase Kayıt
    for idx, c in enumerate(chunks):
        out_ogg = f"data/temp_audio/chunk_{idx}.ogg"
        clip_duration = c["end"] - c["start"]
        
        # WhatsApp PTT uyumlu libopus 32k kesme komutu
        ffmpeg_cmd = (
            f'ffmpeg -y -ss {c["start"]:.2f} -i "{audio_path}" -t {clip_duration:.2f} '
            f'-c:a libopus -b:a 32k -vbr on -application voip "{out_ogg}"'
        )
        subprocess.run(ffmpeg_cmd, shell=True, check=True)
        
        # Cloudflare R2 Yükle (ContentType: audio/ogg WhatsApp için kritiktir!)
        r2_key = f"halis_aydemir/{os.path.basename(video_url)}_{idx}.ogg"
        s3.upload_file(
            out_ogg, 
            config.R2_BUCKET_NAME, 
            r2_key,
            ExtraArgs={"ContentType": "audio/ogg"}
        )
        audio_public_url = f"{config.R2_PUBLIC_BASE_URL}/{r2_key}"
        
        # text-embedding-004 ile 768d Vektör Oluştur
        emb_res = ai.models.embed_content(
            model="text-embedding-004",
            contents=c["text"]
        )
        embedding = emb_res.embedding.values

        # Supabase knowledge_chunks tablosuna ekle
        supabase.table("knowledge_chunks").insert({
            "source_type": "HALIS_AYDEMIR",
            "source_title": f"Halis Aydemir Sohbet Kesiti #{idx+1}",
            "content": c["text"],
            "tags": ["HALIS_AYDEMIR", "TEVEKKUL_VE_MURAKABE"],
            "nafs_traps": ["UMITSIZLIK_KARAMSARLIK"],
            "youtube_id": video_url,
            "start_sec": c["start"],
            "end_sec": c["end"],
            "audio_url": audio_public_url,
            "embedding": embedding
        }).execute()

        os.remove(out_ogg)
        print(f"[Done] Chunk {idx+1}/{len(chunks)} yüklendi -> {audio_public_url}")

    os.remove(audio_path)
```

---

## BÖLÜM 7: WEB ARAYÜZLERİ, "ASKIDA SIRDAŞ" VE OPERATÖR VAS RAPORLAMA

### 7.1. Kurumsal Vitrin ve Meta Uyum Sayfası (`/`)
- **Tasarım Dili:** Derin zümrüt yeşili (`#064e3b`), mat altın (`#d97706`) ve nötr koyu zemin üzerinde zarif İslami tefekkür tasarımı.
- **Doğrudan Başlatma:** `https://wa.me/90XXXXXXXXXX?text=Selamun%20Aleykum` butonu.
- **Kalıcı Sorumluluk Reddi (Legal & Fıkhi Disclaimer Banner):**
  > *"Sırdaş AI bir fetva makamı veya fıkhi merci değildir. Şer'i ve hukuki bağlayıcılığı yoktur. Acil psikolojik veya tıbbi kriz durumlarında lütfen 112 veya 182 numaralı hatları arayınız."*

### 7.2. "Askıda Sırdaş" Bağış Ekranı (`/askida-sirdas`)
- **Felsefe:** Sistem halka tamamen ücretsiz ve reklamsızdır. Sunucu maliyetleri ve model jetonları hayırseverlerin "Askıda Sırdaş" havuzuna yaptığı infaklar ile karşılanır.
- **Arayüz:** 50 TL, 100 TL, 250 TL, 500 TL hazır butonlar ve serbest tutar giriş alanı.
- **Ödeme Altyapısı:** PayTR iFrame veya iyzico Checkout Form entegrasyonu.
- **Şeffaf Havuz Sayacı:**
  - *"Bu ay askıda karşılanan dertleşme mesajı: 142.850 adet"*
  - *"Askıdaki bakiye: 24.300 ₺"*

### 7.3. Admin Paneli & Operatör VAS Raporlama (`/admin`)
- **Operatör VAS (Value Added Services) Hacim Raporu:** GSM Operatörleri ile olası sponsorluk veya manevi VAS anlaşmaları için: Kullanıcı sayısı, aktif sohbet süreleri ve eşdeğer dakika raporlaması (`vas_daily_logs`).
- **Jev & Gemini Audit Denetim Günlüğü:** Gemini'nin her cevapta doldurduğu `editor_audit` kayıtlarını filtreleme: `murakabe_applied == false` veya `riba_warning_included == false` olan anomalileri anında tespit etme.
- **Çelik Kasa RAG Yönetimi:** Eklenen ayet, hadis ve Halis Aydemir ses kesitlerini listeleme, arama ve sesleri tarayıcıda doğrudan dinleme.

---

## BÖLÜM 8: FAZ FAZ GELİŞTİRME YOL HARİTASI (PHASE 1 -> PHASE 5)

```
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: PROJE TEMELİ, VERİTABANI VE RAG ALTYAPISI                   │
│  - Next.js 15, Prisma, Supabase pgvector, Cloudflare R2 konfigürasyonu │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: PYTHON VERİ İŞLEME HATTI (/data-pipeline)                   │
│  - RTX 4060 WhisperX, FFmpeg Opus kesici, R2 yükleyici, Çelik Kasa RAG │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: BİLİŞSEL ÇEKİRDEK (SYSTEM 1 JEV + SYSTEM 2 GEMINI 2.5)       │
│  - Jev Client, Gemini Context Cache, Sistem Anayasası, Structured Out  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: WHATSAPP WEBHOOK, ONBOARDING VE after() ASENKRON MOTORU     │
│  - Meta Graph API, 4 Bloklu İkiz State Machine, after() Entegrasyonu   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: WEB ARAYÜZLERİ, "ASKIDA SIRDAŞ" VE OPERATÖR VAS PANELİ       │
│  - Landing, PayTR/iyzico Bağış Sayacı, Admin Dashboard & VAS Raporları │
└────────────────────────────────────────────────────────────────────────┘
```

### Detaylı Faz Dağılımı ve Kodlanacak Dosyalar:

#### PHASE 1: Proje Temeli, Veritabanı ve RAG Altyapısı
- [ ] `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` ve shadcn/ui yapılandırmasının kurulması.
- [ ] `.env.example` ve ortam değişkenlerinin tanımlanması.
- [ ] `prisma/schema.prisma` dosyasının yazılması (`User`, `KnowledgeChunk`, `Message` [waMessageId @unique], `Donation`, `VasDailyLog`).
- [ ] Supabase üzerinde `vector` uzantısının açılması ve Prisma migration'ının çalıştırılması.
- [ ] `prisma/sql/01_pgvector_init.sql` ve `02_hybrid_search_rpc.sql` (Çoklu kaynak dengeli RPC) SQL betiklerinin Supabase'e uygulanması.
- [ ] `src/lib/db/prisma.ts` ve `src/lib/db/supabase.ts` istemcilerinin kodlanması.
- [ ] `src/lib/storage/r2.ts` ile Cloudflare R2 S3 uyumlu bağlantısının test edilmesi.

#### PHASE 2: Lokal Veri İşleme Hattı (`/data-pipeline`)
- [ ] `/data-pipeline/requirements.txt` ve `config.py` yapılandırmasının oluşturulması.
- [ ] `utils/audio_cutter.py`: FFmpeg ile `-c:a libopus -b:a 32k -application voip` formatında `.ogg` kesme fonksiyonu.
- [ ] `utils/r2_uploader.py`: Kesilen ses dosyalarını Cloudflare R2'ya `ContentType: audio/ogg` ile yükleyen modül.
- [ ] `utils/embedder.py` (text-embedding-004) fonksiyonunun kodlanması.
- [ ] `ingest_texts.py`: Kur'an anlamsal pasajları (Bakara 275-279 dahil), Sahih Hadisler ve duaların Supabase'e indekslenmesi.
- [ ] `ingest_youtube.py`: Halis Aydemir YouTube seslerinin indirilmesi, WhisperX (RTX 4060 GPU) ile transkripti, 90-120 sn overlapping kesilmesi, R2'ya yüklenmesi ve Supabase'e kaydedilmesi.

#### PHASE 3: Bilişsel Çekirdek (System 1 Jev + System 2 Gemini 2.5 Flash)
- [ ] `src/lib/ai/jev-client.ts`: Noul, Choice ve Score primitiflerini tek istekte hesaplayan ve fallback içeren Jev API istemcisi.
- [ ] `src/lib/ai/constitution.ts`: 5 Manevi Süzgeç, Siyer Mührü, Riba Kalkanı ve Fetva Yasağını içeren Sistem Anayasası.
- [ ] `src/lib/ai/schemas.ts`: Zod tabanlı `SirdasOutputSchema` ve `editor_audit` şeması.
- [ ] `src/lib/ai/embeddings.ts`: Google `text-embedding-004` API istemcisi.
- [ ] `src/lib/ai/gemini-client.ts`: Gemini 2.5 Flash Context Cache ve Structured Output (`responseSchema`) motoru.
- [ ] `src/lib/ai/orchestrator.ts`: Jev Teşhisi -> RAG Arama -> Gemini Üretim hattının uçtan uca birleştirilmesi.

#### PHASE 4: WhatsApp Webhook, Onboarding State Machine ve Asenkron `after()` Motoru
- [ ] `src/lib/whatsapp/types.ts`: Meta Webhook payload tipleri.
- [ ] `src/lib/whatsapp/security.ts`: `X-Hub-Signature-256` HMAC SHA-256 imza doğrulayıcısı.
- [ ] `src/lib/whatsapp/client.ts`: Meta Graph API (Metin ve R2 `.ogg` ses gönderme) fonksiyonları.
- [ ] `src/lib/whatsapp/onboarding.ts`: 4 Bloklu Dijital İkiz Künyesi State Machine ve doğal dil ayrıştırıcıları.
- [ ] `src/app/api/webhook/whatsapp/route.ts`: GET verify token ve POST `after()` asenkron webhook rotası (`maxDuration = 60`).
- [ ] `waMessageId` ile mükerrer mesaj işleme engeli (idempotency).

#### PHASE 5: Web Arayüzleri, "Askıda Sırdaş" ve Operatör VAS Paneli
- [ ] `src/app/page.tsx`: Meta Business uyumlu ana kurumsal vitrin, wa.me butonu, manevi manifesto ve disclaimer bileşenleri.
- [ ] `src/app/gizlilik-politikasi/page.tsx` ve `src/app/sorumluluk-reddi/page.tsx` sayfaları.
- [ ] `src/app/askida-sirdas/page.tsx`: Esnek tutarlı bağış formu, PayTR / iyzico entegrasyonu ve havuz sayacı.
- [ ] `src/app/api/webhook/payment/route.ts`: Ödeme onay IPN webhook'u.
- [ ] `src/app/admin/page.tsx`, `vas-reports/page.tsx`, `audit-logs/page.tsx`: Operatör VAS raporları ve denetim logları.
- [ ] Vercel dağıtımı ve Production ortamı uçtan uca canlı testi.

---

## BÖLÜM 9: RİSK YÖNETİMİ VE TEST STRATEJİSİ

| Risk / Edge Case | Muhtemel Tehlike | Mimari Çözüm ve Savunma |
| :--- | :--- | :--- |
| **Meta Webhook Retry Storm** | İşlem 3 sn sürerse Meta aynı mesajı tekrar gönderir, mükerrer cevap üretilir. | Next.js 15 `after()` ile Meta'ya <50ms'de `200 OK` dönülür. Mesaj `waMessageId` tekil alanı ile atomik kontrol edilir; mükerrer işleme engellenir. |
| **Kullanıcı Açık Fetva Sorusu** | Boşanma, miras veya helal/haram fıkhi hüküm sorulması. | Jev `is_fiqh_fatwa_request >= 0.75` anında tetiklenir; Gemini hiç çağrılmadan Alo 190 / Müftülük yönlendirme kalıbı gönderilir. |
| **Ağır Psikolojik Kriz / İntihar** | Kullanıcının kendine zarar verme niyeti (`distress_level == 10`). | Jev kriz tespiti yaptığında sistem doğrudan 112 Acil ve 182 hatlarını içeren şefkatli acil yardım mesajını WhatsApp'tan döner. |
| **Faiz ve Borç Sarmalı** | Kullanıcının borç için tekrar kredi çekmeyi veya faizi normal görmesi. | `RIBA_SHIELD_ACTIVE = true` zorunlu kılınır. Bakara 275-279 RAG'dan zorunlu çekilir. Gemini `editor_audit.riba_warning_included = true` denetimiyle faizin manevi yıkımını cevaba zorunlu işler. |
| **Halis Hoca Ses Dosyası Bozuk/Yok** | R2'da ses URL'i geçersizse veya yüklenemediyse. | `orchestrator.ts` ses gönderimi hata verirse akışı kesmez; sadece metin cevabı WhatsApp'a iletir. |
| **Operatör VAS Raporlama Uyuşmazlığı** | Operatör ile mesaj veya süre mutabakatında log kaybı yaşanması. | Her gelen ve giden mesaj `vas_daily_logs` tablosunda atomik olarak artırılır. Günlük bazda kullanıcı başına dakika tahminleme saklanır. |
| **R2 Egress ve MIME Sorunu** | WhatsApp'ın `.ogg` dosyasını çalamaması. | Python pipeline'da sesler `-c:a libopus -b:a 32k -vbr on -application voip` ile kesilir ve R2'ya `ExtraArgs={"ContentType": "audio/ogg"}` ile yüklenir. |
