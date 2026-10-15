import Link from "next/link";
import { ShieldCheck, Database, HardDrive, Cpu, HeartHandshake, PhoneCall } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-16">
      {/* Top Banner / Navbar */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4 border-b border-border/60">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl">
            س
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Sırdaş AI</h1>
            <p className="text-xs text-muted-foreground">Manevi Teskin ve Dijital Sırdaş</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Faz 1: Altyapı Aktif
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center my-16 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          Fetva Vermez • Manevi Ayna Tutar • Çelik Kasa RAG
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-serif leading-tight">
          Gönül Yaralarına Kur&apos;an, Sünnet ve Hikmet Aynası
        </h2>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
          Sırdaş AI; modern çağın dertleri, vesveseleri ve manevi sıkıntıları karşısında kullanıcıya
          fıkhi fetva vermeden, Kur&apos;an-ı Kerim, sahih hadisler ve Halis Aydemir hoca sohbetleri ışığında
          şefkatli bir yol arkadaşlığı sunar.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href="https://wa.me/?text=Selamun%20Aleykum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium shadow hover:bg-primary/90 transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            WhatsApp ile Başla
          </a>
          <Link
            href="/sorumluluk-reddi"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-muted/50 transition-colors"
          >
            Manevi Sınırlar ve Şartlar
          </Link>
        </div>
      </section>

      {/* Phase 1 Infrastructure Status Grid */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="p-6 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-primary">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Supabase & pgvector</h3>
          <p className="text-sm text-muted-foreground">
            Prisma ORM ile 768 boyutlu vector (Google text-embedding-004), HNSW indeksleri ve çoklu kaynak dengeli hibrit RAG RPC fonksiyonu.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Cloudflare R2 Depolama</h3>
          <p className="text-sm text-muted-foreground">
            Sıfır egress maliyetli S3 uyumlu R2 depolama ile Halis Aydemir hoca .ogg (libopus 32k) ses kesitleri dağıtımı.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">İkili Bilişsel Çekirdek</h3>
          <p className="text-sm text-muted-foreground">
            System 1 Jev (hızlı teşhis, fetva koruması, Riba kalkanı) + System 2 Gemini 2.5 Flash Context Cache motoru.
          </p>
        </div>
      </section>

      {/* Footer & Disclaimer Notice */}
      <footer className="w-full max-w-5xl pt-10 pb-6 border-t border-border/60 text-center space-y-4">
        <div className="p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          <p className="font-semibold text-foreground mb-1">Önemli Manevi ve Hukuki Hatırlatma:</p>
          Sırdaş AI fıkhi bir fetva makamı veya psikiyatrik tedavi mercii değildir. Fıkhi hükümler için
          Diyanet İşleri Başkanlığı (Alo 190) veya yetkili müftülüklere, acil kriz durumlarında ise 112 Acil Çağrı Merkezi&apos;ne
          başvurulmalıdır.
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground pt-2">
          <span>&copy; {new Date().getFullYear()} Sırdaş AI. Tüm hakları saklıdır.</span>
          <Link href="/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
          <Link href="/sorumluluk-reddi" className="hover:underline">Sorumluluk Reddi</Link>
          <Link href="/askida-sirdas" className="hover:underline">Askıda Sırdaş</Link>
        </div>
      </footer>
    </main>
  );
}
