import Link from "next/link";
import {
  HeartHandshake,
  Volume2,
  HelpCircle,
  PhoneCall,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Badge } from "@/components/ui/badge";
import { Hero } from "@/components/landing/hero";
import { Manifesto } from "@/components/landing/manifesto";
import { Features } from "@/components/landing/features";

export default function HomePage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+905550200605";
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanWaNumber}?text=Selamun%20Aleykum`;

  const faqs = [
    {
      q: "Sırdaş AI bana fıkhi fetva veya hüküm verir mi?",
      a: "Hayır. Sırdaş AI değişmez anayasası gereği bir fetva makamı, müftülük veya fıkıh merci değildir. Miras, nikah, boşanma, ticari akitler veya helal-haram hükümleri söz konusu olduğunda kullanıcıyı derhal Diyanet İşleri Başkanlığı Din İşleri Yüksek Kurulu Alo 190 hattına yönlendirir.",
    },
    {
      q: "Halis Aydemir sohbet ses kayıtları nasıl seçiliyor ve dinleniyor?",
      a: "Halis Aydemir hocanın tefekkür ve hadis sohbetleri RTX 4060 WhisperX ile hassas transkript edilmiş ve 90-120 saniyelik manevi kesitlere ayrılmıştır. RAG motoru kullanıcının ruh haline en uygun kesiti tespit eder ve WhatsApp üzerinden doğrudan dinlenebilir sesli mesaj (.ogg) olarak iletir.",
    },
    {
      q: "WhatsApp yazışmalarım güvende mi, üçüncü kişilerle paylaşılır mı?",
      a: "Verileriniz 6698 sayılı KVKK ve Meta Business güvenlik standartlarına tam uyumlu olarak korunur. Mesajlar reklam şirketleriyle asla paylaşılmaz, profil bilgileri yalnızca manevi rehberliğin sürekliliği için şifreli veritabanında saklanır.",
    },
    {
      q: "Hizmet ücretli midir? 'Askıda Sırdaş' sistemi nedir?",
      a: "Sırdaş AI halka tamamen ücretsizdir ve asla reklam barındırmaz. Yapay zeka model jetonları ve bulut sunucu masrafları, Osmanlı'daki sadaka taşı ve askıda ekmek geleneğinin dijital hali olan 'Askıda Sırdaş' infak havuzuna hayırseverlerin yaptığı gönüllü katkılarla karşılanır.",
    },
    {
      q: "Ağır bir ruhsal kriz veya intihar düşüncesi anında sistem ne yapar?",
      a: "Sırdaş AI bir psikiyatri kliniği veya acil müdahale ekibi değildir. Kullanıcının kendine veya başkasına zarar verme ihtimali sezildiğinde, System 1 kriz koruması devreye girerek şefkatli bir dille 112 Acil Çağrı Merkezi ve 182 Sağlık Danışma hatlarına yönlendirme yapar.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-amber-500/20 selection:text-amber-300">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <Hero waUrl={waUrl} />

        {/* 5 SPIRITUAL FILTERS SECTION */}
        <Manifesto />

        {/* FEATURES & ÇELİK KASA OVERVIEW */}
        <Features />

        {/* HALİS AYDEMİR AUDIO DEMO PREVIEW */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-emerald-950/90 via-emerald-950/50 to-card p-8 sm:p-12 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Badge variant="gold" className="mb-2">
                  Sesli Teskin Kesiti
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  Halis Aydemir Sohbet Kesitleri
                </h3>
                <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
                  Dertleşme esnasında RAG motorunun tespit ettiği hikmet dolu ses
                  kayıtları, WhatsApp üzerinden kullanıcının kulaklarına sekine
                  olur.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs">
                <Volume2 className="h-4 w-4" />
                <span>libopus 32k .ogg</span>
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-emerald-800/50 p-6 space-y-4 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-emerald-300">
                  Örnek Kesit: Tevekkül ve Rızık Endişesi (90 sn)
                </span>
                <span className="text-amber-400/90">
                  Kaynak: Halis Aydemir Tefekkür Sohbetleri (R2 Depolama)
                </span>
              </div>

              {/* Native HTML5 Audio Player */}
              <audio
                controls
                className="w-full accent-amber-500 rounded-lg focus:outline-none"
                preload="none"
              >
                <source
                  src="https://media.sirdas.ai/halis_aydemir/sample_tevekkul.ogg"
                  type="audio/ogg"
                />
                Tarayıcınız ses oynatıcısını desteklemiyor.
              </audio>

              <p className="text-xs text-emerald-200/70 italic">
                &ldquo;Kul rızık için telaşlandığında bilmeli ki, rızkı veren
                yalnızca Rezzak olan Allah&apos;tır; insan sadece sebeplere hürmet
                eder.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="sss" className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-14">
            <Badge variant="outline" className="text-xs uppercase tracking-wider">
              Aklınıza Takılanlar
            </Badge>
            <h2 className="text-3xl font-bold font-serif tracking-tight text-foreground">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-sm text-muted-foreground">
              Sırdaş AI&apos;nin manevi sınırları, teknik altyapısı ve işleyişi
              hakkında merak edilenler.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-border bg-card p-5 transition-colors open:bg-muted/30 hover:border-amber-500/30"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-foreground font-serif select-none">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{faq.q}</span>
                  </div>
                  <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">
                    ↓
                  </span>
                </summary>
                <div className="mt-4 pt-3 border-t border-border/60 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* BOTTOM FINAL CTA BANNER */}
        <section className="py-16 bg-gradient-to-t from-emerald-950/70 via-emerald-950/30 to-background border-t border-border/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
              Gönlünüzü Ferahlatmaya Bir Selamla Başlayın
            </h2>
            <p className="text-base text-emerald-100/80 max-w-2xl mx-auto">
              Hiçbir ücret ödemeden, doğrudan WhatsApp üzerinden Selamun Aleykum
              yazarak sırdaşınızla buluşabilirsiniz.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-base shadow-xl transition-all border border-emerald-600/40"
              >
                <PhoneCall className="h-5 w-5 text-emerald-300" />
                <span>WhatsApp Sohbeti Başlat</span>
              </a>

              <Link
                href="/askida-sirdas"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold text-base transition-colors border border-amber-500/40"
              >
                <HeartHandshake className="h-5 w-5" />
                <span>Askıda Sırdaş&apos;a Destek Ol</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
