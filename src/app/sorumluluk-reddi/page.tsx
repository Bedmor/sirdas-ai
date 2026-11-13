import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Şer'i Hukuki Çerçeve | Manevi Pusula",
  description:
    "Manevi Pusula fıkhi fetva veya tıbbi tedavi makamı değildir. Resmi sınırlar, Diyanet Alo 190 ve acil yardım hatları 112 / 182 bilgilendirmesi.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-10">
          {/* Header */}
          <div className="border-b border-outline-variant/30 pb-8 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
              Şer&apos;i ve Hukuki Temel Çerçeve
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-on-surface tracking-tight">
              Şer&apos;i Hukuki Çerçeve
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              Bu metin, Manevi Pusula platformunu kullanan her bireyin kabul etmiş sayıldığı fıkhi,
              tıbbi ve cezai sorumluluk sınırlarını ve acil kriz protokollerini ihtiva eder.
            </p>
          </div>

          {/* Critical Warning Cards (No tacky badges) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl border border-primary/40 bg-surface-container/90 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <i className="ph ph-scales text-lg"></i>
                <span>Fetva Mercii Değildir</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Fıkhi hüküm, helal-haram tespiti ve şer&apos;i bağlayıcılığı olan fetva üretmez.
              </p>
              <a
                href="tel:190"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-amber-300 transition-colors pt-1"
              >
                <i className="ph ph-phone-call text-sm"></i>
                <span>Diyanet Alo 190 Fetva Hattı</span>
              </a>
            </div>

            <div className="p-6 rounded-2xl border border-red-500/40 bg-surface-container/90 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
                <i className="ph ph-warning text-lg"></i>
                <span>Acil Kriz Hattı Değildir</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                İntihar, kendine veya başkasına zarar verme riski durumunda derhal acil yardım
                çağrılmalıdır.
              </p>
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-200 transition-colors pt-1"
              >
                <i className="ph ph-first-aid text-sm"></i>
                <span>112 Acil Çağrı</span>
              </a>
            </div>

            <div className="p-6 rounded-2xl border border-outline-variant/50 bg-surface-container/90 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
                <i className="ph ph-heartbeat text-lg"></i>
                <span>Tıbbi Tedavi Değildir</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Klinik psikoloji veya psikiyatri teşhisi sunmaz, hekim tavsiyesinin yerine geçmez.
              </p>
              <a
                href="tel:182"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-emerald-300 transition-colors pt-1"
              >
                <i className="ph ph-phone text-sm"></i>
                <span>182 MHRS Sağlık Hattı</span>
              </a>
            </div>
          </div>

          {/* Detailed Sections */}
          <article className="space-y-8 text-slate-300 leading-relaxed">
            <section
              id="fetva-siniri"
              className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-3"
            >
              <h2 className="text-xl font-heading font-semibold text-on-surface">
                1. Fıkhi ve Dini Sorumluluk Sınırı (Fetva Makamı Değildir)
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Manevi Pusula, İslam hukukunun (fıkıh) ihtisas gerektiren miras paylaşımı, nikah, talak
                (boşanma), ticaret hukuku, faiz ve şüpheli kazançlar gibi teknik ve içtihadi
                konularında kesinlikle fetva verme yetkisine sahip değildir ve bu iddiada bulunmaz.
              </p>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Sistemin sunduğu mealler, sahih hadisler ve hikmetli tefekkür kesitleri;
                kulun kalbini dünyevi hırslardan arındırmak, nefsin tuzaklarını fark ettirmek ve
                tevekkülü diri tutmak için sunulan &ldquo;manevi ayna&rdquo; niteliğindedir. Şer&apos;i
                hüküm gerektiren hallerde Türkiye Cumhuriyeti Diyanet İşleri Başkanlığı Din İşleri
                Yüksek Kurulu (Diyanet Alo 190 Fetva Hattı) veya liyakat sahibi müftülüklere
                danışılması zaruridir.
              </p>
            </section>

            <section
              id="kriz-rehberi"
              className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-4"
            >
              <h2 className="text-xl font-heading font-semibold text-on-surface">
                2. Acil Ruhsal Kriz, İntihar ve Güvenlik Protokolü
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Manevi Pusula; intihar eğilimi, ağır depresif atak, kendine veya çevresine zarar verme
                niyeti gibi hayati tehlike arz eden durumlarda bir acil müdahale ekibi veya
                psikiyatrik tedavi merkezi değildir.
              </p>
              <div className="rounded-xl border border-red-500/30 bg-error-container/40 p-5 text-xs text-red-200 space-y-2">
                <strong className="block text-sm font-semibold text-white">
                  Acil Durum Protokolü:
                </strong>
                <p className="leading-relaxed">
                  Eğer kendinizi veya bir yakınınızı ağır bir kriz içerisinde hissediyorsanız, vakit
                  kaybetmeden:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-200">
                  <li>
                    <strong>112 Acil Çağrı</strong> Merkezi&apos;ni arayarak ambulans ve uzman
                    desteği talep ediniz.
                  </li>
                  <li>
                    <strong>182 MHRS Sağlık Hattı</strong> üzerinden uzman hekim randevusu alınız.
                  </li>
                  <li>En yakın hastanenin acil servisine başvurunuz.</li>
                </ul>
              </div>
            </section>

            <section className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-3">
              <h2 className="text-xl font-heading font-semibold text-on-surface">
                3. Cezai ve Hukuki Sorumluluğun Reddi
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Manevi Pusula tarafından üretilen metin veya sesli tefekkür çıktılarının uygulanması
                sonucunda doğrudan veya dolaylı olarak doğabilecek maddi, manevi, fıkhi veya hukuki
                zararlardan platform geliştiricileri, içerik sağlayıcıları ve vakıf yetkilileri
                sorumlu tutulamaz.
              </p>
            </section>

            <section className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-secondary/40 space-y-3">
              <h2 className="text-xl font-heading font-semibold text-on-surface flex items-center gap-2">
                <i className="ph ph-shield-check text-secondary text-xl"></i>
                <span>4. Mahremiyet Esasları, Kendi İradesiyle Paylaşım ve Unutulma Hakkı</span>
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                6698 sayılı KVKK md. 6 uyarınca dini inanç ve manevi durumlar özel nitelikli kişisel veridir.
                Kullanıcı bu platformu kullanmadan önce tek tıkla açık rıza onayını vermekte; paylaşımlarını
                tamamen kendi hür iradesiyle ve anonim olarak iletmektedir. Sistem bu kayıtları kimlik bilgileriyle
                asla eşleştirmez. Kullanıcı dilediği vakit tek tıkla &ldquo;Benlik Hafızamı Sıfırla / Tüm Verilerimi Sil&rdquo;
                butonuna basarak unutulma hakkını icra edebilir. Ayrıntılar için{" "}
                <a href="/gizlilik-politikasi#ozel-nitelikli-veri" className="text-primary underline hover:text-amber-300">
                  Mahremiyet Esasları metnini
                </a>{" "}
                inceleyebilirsiniz.
              </p>
            </section>

            <section className="bg-surface-container/60 p-6 sm:p-8 rounded-2xl border border-primary/40 space-y-3">
              <h2 className="text-xl font-heading font-semibold text-on-surface flex items-center gap-2">
                <i className="ph ph-envelope-simple text-primary text-xl"></i>
                <span>5. Görüş, Öneri ve Hatalı Cevap Bildirimi</span>
              </h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Manevi Pusula yapay zeka destekli bir tefekkür ve dertleşme alanıdır; her yapay zeka sistemi gibi zaman zaman hata yapabilir veya bağlama tam uymayan ifadeler üretebilir. Karşılaştığınız hatalı yanıtlar, fıkhi veya ilmi tenkitler, üslup eleştirileri ve geliştirme önerileriniz için bize doğrudan{" "}
                <a
                  href="mailto:adnan.kus@hotmail.com?subject=Manevi%20Pusula%20-%20G%C3%B6r%C3%BC%C5%9F%2C%20%C3%96neri%20ve%20Hata%20Bildirimi"
                  className="text-primary underline hover:text-amber-300 font-medium"
                >
                  adnan.kus@hotmail.com
                </a>{" "}
                e-posta adresi üzerinden ulaşabilirsiniz.
              </p>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Tarafımıza iletilen tüm görüş, öneri ve hata bildirimleri titizlikle incelenmekte; korpus, denetim filtreleri ve tefekkür modelleri bu geri bildirimler ışığında sürekli iyileştirilmektedir.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
