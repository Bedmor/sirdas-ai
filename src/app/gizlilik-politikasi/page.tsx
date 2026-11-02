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
                arayüz üzerinden &ldquo;Hafızamı Sıfırla&rdquo; veya &ldquo;Sohbeti Temizle&rdquo; komutu vererek kendi profil
                ve mesaj kayıtlarını kalıcı olarak silebilir.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
