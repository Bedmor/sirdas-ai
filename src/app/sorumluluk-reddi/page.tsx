import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { ShieldAlert, AlertTriangle, PhoneCall, HeartPulse, Scale, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sorumluluk Reddi ve Manevi Sınırlar | Sırdaş AI",
  description:
    "Sırdaş AI fıkhi fetva veya tıbbi tedavi makamı değildir. Resmi sınırlar, Diyanet Alo 190 ve acil yardım hatları 112 / 182 bilgilendirmesi.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-border/80 pb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Şer&apos;i ve Hukuki Temel Çerçeve
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground">
              Sorumluluk Reddi ve Manevi Sınırlar Beyanı
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bu metin, Sırdaş AI platformunu kullanan her bireyin kabul etmiş sayıldığı fıkhi,
              tıbbi ve cezai sorumluluk sınırlarını ve acil kriz protokollerini ihtiva eder.
            </p>
          </div>

          {/* Critical Warning Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <Scale className="h-4 w-4" />
                <span>Fetva Mercii Değildir</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fıkhi hüküm, helal-haram tespiti ve şer&apos;i bağlayıcılığı olan fetva üretmez.
              </p>
              <a
                href="tel:190"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 underline pt-1"
              >
                <PhoneCall className="h-3 w-3" />
                Alo 190 Diyanet Fetva
              </a>
            </div>

            <div className="p-5 rounded-xl border border-rose-500/40 bg-rose-500/5 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Acil Kriz Hattı Değildir</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                İntihar, kendine veya başkasına zarar verme riski durumunda derhal acil yardım çağrılmalıdır.
              </p>
              <a
                href="tel:112"
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 underline pt-1"
              >
                <AlertTriangle className="h-3 w-3" />
                112 Acil Çağrı Merkezi
              </a>
            </div>

            <div className="p-5 rounded-xl border border-blue-500/40 bg-blue-500/5 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                <HeartPulse className="h-4 w-4" />
                <span>Tıbbi Tedavi Değildir</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Klinik psikoloji veya psikiyatri teşhisi sunmaz, hekim tavsiyesinin yerine geçmez.
              </p>
              <a
                href="tel:182"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 underline pt-1"
              >
                <HeartPulse className="h-3 w-3" />
                182 MHRS Sağlık Hattı
              </a>
            </div>
          </div>

          {/* Detailed Sections */}
          <article className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
            <section id="fetva-siniri" className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                1. Fıkhi ve Dini Sorumluluk Sınırı (Fetva Makamı Değildir)
              </h2>
              <p className="text-sm text-muted-foreground">
                Sırdaş AI, İslam hukukunun (fıkıh) ihtisas gerektiren miras paylaşımı, nikah, talak (boşanma), ticaret hukuku, faiz ve şüpheli kazançlar gibi teknik ve içtihadi konularında kesinlikle fetva verme yetkisine sahip değildir ve bu iddiada bulunmaz.
              </p>
              <p className="text-sm text-muted-foreground">
                Sistemin sunduğu mealler, sahih hadisler ve Halis Aydemir hoca sohbet kesitleri; kulun kalbini dünyevi hırslardan arındırmak, nefsin tuzaklarını fark ettirmek ve tevekkülü diri tutmak için sunulan &ldquo;manevi ayna&rdquo; niteliğindedir. Şer&apos;i hüküm gerektiren hallerde Türkiye Cumhuriyeti Diyanet İşleri Başkanlığı Din İşleri Yüksek Kurulu (Alo 190) veya liyakat sahibi müftülüklere danışılması zaruridir.
              </p>
            </section>

            <section id="kriz-rehberi" className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                2. Acil Ruhsal Kriz, İntihar ve Güvenlik Protokolü
              </h2>
              <p className="text-sm text-muted-foreground">
                Sırdaş AI; intihar eğilimi, ağır depresif atak, kendine veya çevresine zarar verme niyeti gibi hayati tehlike arz eden durumlarda bir acil müdahale ekibi veya psikiyatrik tedavi merkezi değildir.
              </p>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-950 dark:text-rose-200 space-y-2">
                <strong className="block text-sm font-bold">
                  Acil Durum Bildirimi:
                </strong>
                <p>
                  Eğer kendinizi veya bir yakınınızı ağır bir kriz içerisinde hissediyorsanız, vakit kaybetmeden:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>112 Acil Çağrı Merkezi</strong>&apos;ni arayarak ambulans ve uzman desteği talep ediniz.</li>
                  <li><strong>182 MHRS</strong> üzerinden en yakın Psikiyatri / Ruh Sağlığı ve Hastalıkları uzmanından randevu alınız.</li>
                  <li>Yalnız kalmayınız; en yakın aile ferdinizle veya güvendiğiniz bir dostunuzla irtibata geçiniz.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                3. Tıbbi ve Psikiyatrik Sorumluluk Reddi
              </h2>
              <p className="text-sm text-muted-foreground">
                Platform üzerinden verilen hiçbir cevap; tıp hekimliği, psikiyatri muayenesi veya yetkili klinik psikolog terapisi niteliği taşımaz. Sırdaş AI ilaç tavsiyesi veremez, reçete yazamaz veya ruhsal teşhiste bulunamaz. Mevcut tedavilerinizi aksatmamanız ve uzman hekim kontrolünde kalmanız gerekmektedir.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                4. Yapay Zeka Hata Payı (Hallucination) ve Sorumluluk Sınırı
              </h2>
              <p className="text-sm text-muted-foreground">
                Sırdaş AI, Çelik Kasa RAG mimarisiyle ayet, hadis ve ses kayıtlarını titizlikle doğrulayarak aktarmak üzere tasarlanmıştır. Bununla birlikte, tüm üretken yapay zeka modellerinde olduğu gibi teknik aksaklıklar, dil sürçmeleri veya anlamsal sapmalar meydana gelebilir. Kullanıcı, sistemin ürettiği metinlerin mutlak hatasızlık garantisi taşımadığını ve dini/hukuki kararlarında nihai referans kabul edilemeyeceğini beyan ve kabul eder.
              </p>
            </section>

            <section className="space-y-3 border-t border-border/80 pt-6">
              <h2 className="text-xl font-bold font-serif text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                5. Kullanım Onayı
              </h2>
              <p className="text-sm text-muted-foreground">
                Sırdaş AI&apos;ye WhatsApp veya internet arayüzleri üzerinden mesaj gönderen her kullanıcı, bu Sorumluluk Reddi ve Manevi Sınırlar metnini bütünüyle okuduğunu, anladığını ve şartlarını gayrikabili rücu kabul ettiğini taahhüt eder.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
