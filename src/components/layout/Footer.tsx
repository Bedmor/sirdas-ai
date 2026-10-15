import React from "react";
import Link from "next/link";
import { PhoneCall, AlertCircle, HeartPulse, HeartHandshake, ExternalLink, ShieldCheck } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+905550200605";
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanWaNumber}?text=Selamun%20Aleykum`;

  return (
    <footer className="w-full border-t border-border/80 bg-card text-card-foreground">
      {/* Upper Footer: Hotlines Reminder */}
      <div className="border-b border-border/50 bg-muted/30 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Şer&apos;i Güvence:</strong> Sırdaş AI fetva üretmez; Kur&apos;an, Sahih Sünnet ve Halis Aydemir tefekkür külliyatıyla manevi teskin ve ayna vazifesi görür.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-foreground">Resmi Destek Hatları:</span>
            <a
              href="tel:190"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <PhoneCall className="h-3 w-3 text-amber-500" />
              <span>Alo 190 (Diyanet Fetva)</span>
            </a>
            <span className="text-border">•</span>
            <a
              href="tel:112"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <AlertCircle className="h-3 w-3 text-rose-500" />
              <span>112 (Acil Kriz)</span>
            </a>
            <span className="text-border">•</span>
            <a
              href="tel:182"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <HeartPulse className="h-3 w-3 text-blue-500" />
              <span>182 (Sağlık Danışma)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand & Philosophy */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-amber-500/40 flex items-center justify-center text-amber-300 font-serif font-bold text-xl shadow-inner">
              س
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground font-serif">
                Sırdaş AI
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Manevi Teskin &amp; Dijital Sırdaş
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Modern çağın dertleri, vesveseleri ve manevi sıkıntıları karşısında; fıkhi fetva vermeden kulun nefsini deşifre eden ve İlahi rızaya ayna tutan şefkatli rehberlik platformu.
          </p>
          <div className="pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <span>WhatsApp Sohbeti Başlat</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Platform
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Ana Sayfa
              </Link>
            </li>
            <li>
              <Link
                href="/#manevi-suzgecler"
                className="hover:text-foreground transition-colors"
              >
                5 Sarsılmaz Manevi Süzgeç
              </Link>
            </li>
            <li>
              <Link
                href="/#ozellikler"
                className="hover:text-foreground transition-colors"
              >
                Çelik Kasa RAG Mimarisi
              </Link>
            </li>
            <li>
              <Link
                href="/#sss"
                className="hover:text-foreground transition-colors"
              >
                Sıkça Sorulan Sorular
              </Link>
            </li>
            <li>
              <Link
                href="/askida-sirdas"
                className="hover:text-foreground transition-colors flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                Askıda Sırdaş İnfak Havuzu
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal & Boundaries */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Hukuki ve Şer&apos;i Sınırlar
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link
                href="/sorumluluk-reddi"
                className="hover:text-foreground transition-colors"
              >
                Sorumluluk Reddi (Disclaimer)
              </Link>
            </li>
            <li>
              <Link
                href="/gizlilik-politikasi"
                className="hover:text-foreground transition-colors"
              >
                Gizlilik Politikası (KVKK / Meta)
              </Link>
            </li>
            <li>
              <Link
                href="/sorumluluk-reddi#fetva-siniri"
                className="hover:text-foreground transition-colors"
              >
                Fetva ve Fıkıh Yasakları
              </Link>
            </li>
            <li>
              <Link
                href="/sorumluluk-reddi#kriz-rehberi"
                className="hover:text-foreground transition-colors"
              >
                Acil Kriz Müdahale Protokolü
              </Link>
            </li>
            <li>
              <Link
                href="/gizlilik-politikasi#veri-guvenligi"
                className="hover:text-foreground transition-colors"
              >
                Uçtan Uca Veri Güvenliği
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Yönetim & Altyapı */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Yönetim ve Altyapı
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link
                href="/admin"
                className="hover:text-foreground transition-colors"
              >
                Admin Genel Bakış
              </Link>
            </li>
            <li>
              <Link
                href="/admin/vas-reports"
                className="hover:text-foreground transition-colors"
              >
                Operatör VAS Raporları
              </Link>
            </li>
            <li>
              <Link
                href="/admin/audit-logs"
                className="hover:text-foreground transition-colors"
              >
                Jev &amp; Gemini Denetim Logları
              </Link>
            </li>
            <li>
              <Link
                href="/admin/knowledge"
                className="hover:text-foreground transition-colors"
              >
                Çelik Kasa RAG İçerik Tarayıcı
              </Link>
            </li>
          </ul>

          <div className="pt-2">
            <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground">Mimari Güvence:</div>
              <p>Next.js 15 • Supabase pgvector • Cloudflare R2 • Jev System 1 • Gemini 2.5 Flash</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/60 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; {currentYear} Sırdaş AI Platformu. İhlas, edep ve emanet şuuruyla inşa edilmiştir.
          </p>
          <p className="italic text-[11px]">
            &ldquo;Kalpler ancak Allah&apos;ı anmakla mutmain olur.&rdquo; (Ra&apos;d, 28)
          </p>
        </div>
      </div>
    </footer>
  );
}
