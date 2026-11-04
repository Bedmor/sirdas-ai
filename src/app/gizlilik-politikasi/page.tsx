import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni | Manevi Pusula",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Meta Business standartlarına uygun Manevi Pusula gizlilik ve veri güvenliği beyanı.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-10">
          {/* Header */}
          <div className="border-b border-outline-variant/30 pb-8 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
              KVKK &amp; Meta Business Uyumlu Resmi Aydınlatma
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
              Gizlilik Politikası ve Kişisel Verilerin Korunması
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Son Güncelleme: 15 Ekim 2026 • Yürürlük Sürümü: v1.3
            </p>
          </div>

          {/* Quick Notice Card */}
          <div className="rounded-2xl border border-secondary/30 bg-surface-container/90 p-6 flex items-start gap-4 text-xs text-slate-300 leading-relaxed shadow-lg">
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-secondary/40 flex items-center justify-center text-secondary shrink-0">
              <i className="ph ph-lock-key text-xl text-secondary"></i>
            </div>
            <div>
              <strong className="text-on-surface block text-sm font-semibold mb-1">
                Emanet ve Mahremiyet İlkesi:
              </strong>
              Manevi Pusula, kullanıcıların manevi sırlarını ve dertleşmelerini İslami emanet şuuruyla
              korur. Mesajlarınız kesinlikle ticari reklam hedeflemesinde kullanılmaz, üçüncü
              şahıslara veya veri simsarlarına satılmaz.
            </div>
          </div>

          {/* Document Content */}
          <article className="space-y-8 text-slate-300 leading-relaxed">
            <section className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-3">
              <h2 className="text-xl font-heading font-semibold text-on-surface flex items-center gap-2">
                <i className="ph ph-scroll text-lg text-primary"></i>
                <span>1. Veri Sorumlusunun Kimliği</span>
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca,
                Manevi Pusula Platformu (&ldquo;Manevi Pusula&rdquo; veya &ldquo;Platform&rdquo;) olarak,
                hizmetlerimizden yararlanan kullanıcılarımızın kişisel verilerinin güvenliğine,
                mahremiyetine ve mevzuata uygun işlenmesine en üst derecede ehemmiyet vermekteyiz.
              </p>
            </section>

            <section className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-3">
              <h2 className="text-xl font-heading font-semibold text-on-surface flex items-center gap-2">
                <i className="ph ph-check-circle text-lg text-secondary"></i>
                <span>2. İşlenen Kişisel Veri Kategorileri</span>
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Platform üzerinden sunulan Web Sitesi ve Mobil Uygulama tabanlı manevi rehberlik
                hizmeti kapsamında aşağıdaki veriler işlenmektedir:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300 font-light">
                <li>
                  <strong className="text-on-surface">Oturum ve İstemci Verileri:</strong> Web ve mobil
                  oturumlarında anonim istemci kimliği (`clientId`) ve isteğe bağlı kullanıcı hesap bilgileri.
                </li>
                <li>
                  <strong className="text-on-surface">Sohbet ve İçerik Verileri:</strong>{" "}
                  Kullanıcının dertleşme esnasında web sitesi veya mobil uygulama üzerinden ilettiği metin mesajları ve
                  sisteme ait tefekkür cevap kayıtları.
                </li>
                <li>
                  <strong className="text-on-surface">4 Bloklu Dijital İkiz Künyesi:</strong>{" "}
                  Kullanıcının kendi rızasıyla onboarding sürecinde paylaştığı hayat rolleri, manevi
                  imtihan konuları ve biyolojik enerji tercihleri.
                </li>
                <li>
                  <strong className="text-on-surface">Bağış ve İnfak Verileri:</strong> &ldquo;Askıda
                  Pusula&rdquo; havuzuna infak yapılması durumunda isim (tercihen anonim), tutar,
                  ödeme sağlayıcı (PayTR/iyzico) işlem referansı. Kredi kartı bilgileri asla
                  sunucularımızda saklanmaz.
                </li>
                <li>
                  <strong className="text-on-surface">Teknik ve Denetim Verileri:</strong> İstemci
                  oturum tekil kimlikleri (mükerrer retry storm mesajlarını önleme ve güvenli oturum yönetimi amacıyla), Jev System 1
                  karar skorları ve Gemini denetim logları.
                </li>
              </ul>
            </section>

            <section
              id="veri-guvenligi"
              className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-3"
            >
              <h2 className="text-xl font-heading font-semibold text-on-surface flex items-center gap-2">
                <i className="ph ph-shield-check text-lg text-secondary"></i>
                <span>3. Uçtan Uca Veri Güvenliği ve Saklama Süreleri</span>
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Kişisel verileriniz, PostgreSQL Supabase pgvector altyapısında şifreli olarak ve
                Cloudflare kurumsal güvenlik kalkanı altında muhafaza edilir. Kullanıcı dilediği an
                arayüz üzerinden &ldquo;Benlik Hafızamı Sıfırla / Tüm Verilerimi Sil&rdquo; veya chat üzerinden
                &ldquo;Hafızamı Sıfırla&rdquo; komutu vererek kendi profil ve mesaj kayıtlarını kalıcı olarak silebilir.
              </p>
            </section>

            <section
              id="ozel-nitelikli-veri"
              className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-primary/40 space-y-5"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-xl">
                <i className="ph ph-shield-star text-2xl"></i>
                <h2>4. Hukuki Zırh: Özel Nitelikli Kişisel Veriler ve KVKK Kalkanı</h2>
              </div>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Türkiye Cumhuriyeti 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;)
                madde 6 hükmü uyarınca; dini inanç, felsefi kanaat, mezhep, ahlaki tutum, ruhsal ve manevi
                hal ve ailevi bilgiler <strong className="text-on-surface">&ldquo;Özel Nitelikli Kişisel Veri&rdquo;</strong> sınıfına
                girmektedir. Manevi Pusula, bu hassas verilerin korunmasında 3 kademeli hukuki kalkanı titizlikle uygular:
              </p>

              <div className="grid grid-cols-1 gap-4 pt-1">
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-high/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
                    <span className="w-6 h-6 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-xs">1</span>
                    <span>Açık Rıza Pop-up Onayı (KVKK md. 6/2)</span>
                  </div>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Kullanıcı sohbeti başlatmadan önce tek tıkla onay verir: <em className="text-primary-fixed-dim font-medium">&ldquo;Size daha iyi bir manevi rehberlik sunabilmek adına, aktardığınız anonimleştirilmiş durum özetlerinin şifrelenerek hafızada tutulmasını kabul ediyorsunuz.&rdquo;</em> Bu onay, sistemin kullanıcıya özel tefekkür desteği sunması için gereken hukuki rıza zeminini teşkil eder.
                  </p>
                </div>

                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-high/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                    <span className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-xs">2</span>
                    <span>Kendi İradesiyle Paylaşım ve Kimliksizleştirme İlkesi</span>
                  </div>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Hukuk disiplininde temel kuraldır: Kişi kendi hür iradesiyle ve anonimleştirilmiş bir ortamda durumunu anlatıyorsa ve sistem bunu kimliğiyle (ad, soyad, T.C. kimlik numarası, ikametgah, telefon rehberi) asla eşleştirmiyorsa, ortada hukuken bir veri ihlali doğmaz. Manevi Pusula Web arayüzü sıfır kimlik bilgisi (zero-PII) prensibiyle çalışır; ziyaretçiye yalnızca rastgele tekil istemci anahtarı atanır.
                  </p>
                </div>

                <div id="unutulma-hakki" className="rounded-xl border border-outline-variant/40 bg-surface-container-high/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-300 text-sm font-semibold">
                    <span className="w-6 h-6 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-xs">3</span>
                    <span>Tek Tıkla Hafızamı Sil (Unutulma Hakkı - Right to be Forgotten)</span>
                  </div>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    KVKK madde 11 ve uluslararası standartlar (GDPR md. 17) gereğince, kullanıcı sol menüde yer alan <strong className="text-red-200">&ldquo;Benlik Hafızamı Sıfırla / Tüm Verilerimi Sil&rdquo;</strong> butonuna bastığı an; arka plandaki tüm sohbet geçmişi, 4 bloklu dijital ikiz profili ve anonim JSON kaydı PostgreSQL veritabanından kalıcı ve geri döndürülemez şekilde silinir. Bu tam kullanıcı kontrolü, platformu mevzuat nezdinde kusursuz kılar.
                  </p>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
