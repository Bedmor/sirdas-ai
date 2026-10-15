import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Shield, Lock, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni | Sırdaş AI",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Meta Business standartlarına uygun Sırdaş AI gizlilik ve veri güvenliği beyanı.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-border/80 pb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
              <Shield className="h-3.5 w-3.5" />
              KVKK &amp; Meta Business Uyumlu Resmi Aydınlatma
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground">
              Gizlilik Politikası ve Kişisel Verilerin Korunması
            </h1>
            <p className="text-sm text-muted-foreground">
              Son Güncelleme: 15 Ekim 2026 • Yürürlük Sürümü: v1.2
            </p>
          </div>

          {/* Quick Notice Card */}
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-5 flex items-start gap-3.5 text-xs text-emerald-200/90 leading-relaxed">
            <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">
                Emanet ve Mahremiyet İlkesi:
              </strong>
              Sırdaş AI, kullanıcıların manevi sırlarını ve dertleşmelerini İslami emanet şuuruyla korur.
              Mesajlarınız kesinlikle ticari reklam hedeflemesinde kullanılmaz, üçüncü şahıslara veya veri simsarlarına satılmaz.
            </div>
          </div>

          {/* Document Content */}
          <article className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                1. Veri Sorumlusunun Kimliği
              </h2>
              <p className="text-sm text-muted-foreground">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca,
                Sırdaş AI Platformu (&ldquo;Sırdaş AI&rdquo; veya &ldquo;Platform&rdquo;) olarak,
                hizmetlerimizden yararlanan kullanıcılarımızın kişisel verilerinin güvenliğine,
                mahremiyetine ve mevzuata uygun işlenmesine en üst derecede ehemmiyet vermekteyiz.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                2. İşlenen Kişisel Veri Kategorileri
              </h2>
              <p className="text-sm text-muted-foreground">
                Platform üzerinden sunulan WhatsApp tabanlı manevi rehberlik hizmeti kapsamında aşağıdaki veriler işlenmektedir:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  <strong>İletişim Verileri:</strong> WhatsApp telefon numarası (`phoneNumber`) ve Meta Graph API tarafından sağlanan kullanıcı rumuzu.
                </li>
                <li>
                  <strong>Sohbet ve İçerik Verileri:</strong> Kullanıcının dertleşme esnasında WhatsApp üzerinden ilettiği metin mesajları ve sisteme ait cevap kayıtları.
                </li>
                <li>
                  <strong>4 Bloklu Dijital İkiz Künyesi:</strong> Kullanıcının kendi rızasıyla onboarding sürecinde paylaştığı hayat rolleri (örn. evli, talebe), manevi imtihan konuları (örn. rızık kaygısı, öfke), biyolojik enerji tercihleri ve üslup talebi.
                </li>
                <li>
                  <strong>Bağış ve İnfak Verileri:</strong> &ldquo;Askıda Sırdaş&rdquo; havuzuna infak yapılması durumunda isim (tercihen anonim), tutar, ödeme sağlayıcı (PayTR/iyzico) işlem referansı. Kredi kartı bilgileri asla sunucularımızda saklanmaz.
                </li>
                <li>
                  <strong>Teknik ve Denetim Verileri:</strong> Meta Webhook `waMessageId` tekil kimlikleri (mükerrer mesaj önleme amacıyla), Jev System 1 karar skorları ve Gemini editör denetim logları.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri
              </h2>
              <p className="text-sm text-muted-foreground">
                Kişisel verileriniz, KVKK&apos;nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları dahilinde aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>WhatsApp üzerinden kişiselleştirilmiş manevi rehberlik, teskin ve Kur&apos;an/Hadis meali hatırlatması sunulması,</li>
                <li>4 Bloklu Dijital İkiz ile kullanıcının manevi bağlamını hatırlayarak her defasında baştan başlamasını önleme,</li>
                <li>Sistem güvenliğinin temini, Meta retry-storm mükerrer mesajlarının engellenmesi (`waMessageId`),</li>
                <li>Acil kriz ve kendine zarar verme durumlarının tespiti halinde 112/182 resmi yönlendirmelerinin şefkatle yapılabilmesi,</li>
                <li>&ldquo;Askıda Sırdaş&rdquo; infak havuzunun muhasebe ve şeffaflık kayıtlarının tutulması.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                4. Bulut Altyapısı ve Üçüncü Taraf Veri Aktarımı
              </h2>
              <p className="text-sm text-muted-foreground">
                Verileriniz yalnızca sistemin teknik olarak çalışması için zaruri olan, endüstri standardı güvenlik sertifikalarına sahip aşağıdaki güvenilir servis sağlayıcılar üzerinden işlenir:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground pt-2">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <strong className="text-foreground block">Meta WhatsApp Cloud API</strong>
                  Uçtan uca şifreli mesaj iletimi ve webhook bildirimleri.
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <strong className="text-foreground block">Supabase (PostgreSQL + pgvector)</strong>
                  Şifreli veritabanı ve 768 boyutlu anlamsal RAG aramaları.
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <strong className="text-foreground block">Cloudflare R2</strong>
                  Sıfır veri sızıntılı S3 uyumlu Halis Aydemir ses depolaması.
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <strong className="text-foreground block">PayTR / iyzico</strong>
                  PCI-DSS Seviye 1 uyumlu güvenli ödeme geçidi.
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                5. Verilerin Saklanması ve Silinmesi (Unutulma Hakkı)
              </h2>
              <p className="text-sm text-muted-foreground">
                Kullanıcı dilediği an WhatsApp üzerinden <code>VERİLERİMİ SİL</code> komutunu ileterek veya iletişim kanallarımızdan başvurarak veritabanındaki tüm yazışma geçmişinin ve dijital ikiz künyesinin silinmesini talep edebilir. Talebiniz en geç 48 saat içerisinde geri dönülemez şekilde imha edilir.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold font-serif text-foreground">
                6. İlgili Kişinin Hakları (KVKK Madde 11)
              </h2>
              <p className="text-sm text-muted-foreground">
                KVKK&apos;nın 11. maddesi uyarınca veri sahipleri; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacına uygun kullanılıp kullanılmadığını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme hakkına sahiptir.
              </p>
            </section>

            <section className="space-y-3 border-t border-border/80 pt-6">
              <h2 className="text-xl font-bold font-serif text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                7. İletişim ve Veri Sorumlusu İrtibatı
              </h2>
              <p className="text-sm text-muted-foreground">
                Gizlilik politikamız ve kişisel verilerinizin korunması ile ilgili her türlü soru, görüş veya hak kullanım talebiniz için resmi e-posta adresimiz üzerinden bizimle irtibata geçebilirsiniz:
              </p>
              <p className="text-sm font-semibold text-foreground">
                E-posta: <a href="mailto:mahremiyet@sirdas.ai" className="text-emerald-500 underline">mahremiyet@sirdas.ai</a>
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
