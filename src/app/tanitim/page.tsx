"use client";

import React from "react";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LiveTrialSection } from "@/components/landing/live-trial";
import { AskidaSirdasSection } from "@/components/landing/askida-sirdas-section";

// Landing architecture: Hero, Manifesto, Features, LiveTrialSection, Halis Aydemir Sohbet Kesitleri, Sıkça Sorulan Sorular
export default function TanitimLandingPage() {
  return (
    <>
      <DisclaimerBanner />
      <Navbar />

      <main className="w-full" id="ana-icerik" role="main">
        <div className="flex flex-col w-full relative overflow-hidden">
          {/* HERO + LIVE TRIAL SECTION */}
          <section
            aria-labelledby="hero-baslik"
            className="relative w-full max-w-[1200px] mx-auto px-6 pt-14 pb-16"
          >
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <h1
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-on-surface tracking-tight leading-tight mb-5"
                id="hero-baslik"
                lang="tr"
              >
                Nefsine Ayna, Kalbine Ferahlık: Hayatın İmtihanlarında{" "}
                <span className="text-primary font-bold">Manevi Pusula</span>
              </h1>
              <p
                className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8 font-light"
                lang="tr"
              >
                Kur&apos;an-ı Kerim, Sahih Sünnet ve kadim hikmet rehberliğinde;
                keder, rızık darlığı ve gelecek endişelerinde ilahi rızayı ve
                sükûneti arayanlara samimi bir dertleşme ve tefekkür alanı.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  aria-label="Manevi Pusula Sohbet Arayüzünde Dertleşmeye Başla"
                  className="inline-flex items-center gap-2.5 bg-secondary-container hover:bg-[#117a51] text-white px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all shadow-lg hover:shadow-secondary/10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                  href="/"
                >
                  <i
                    aria-hidden="true"
                    className="ph ph-sparkle text-lg text-secondary"
                  ></i>
                  <span>Manevi Pusula ile Dertleş</span>
                  <i aria-hidden="true" className="ph ph-arrow-right text-xs"></i>
                </Link>
                <a
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-sm text-slate-200 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                  href="#sohbet-ornekleri"
                >
                  <i
                    aria-hidden="true"
                    className="ph ph-book-open text-lg text-secondary"
                  ></i>
                  <span>Örnek Senaryolar</span>
                </a>
              </div>
            </div>

            <LiveTrialSection waUrl="/" />
          </section>

          {/* ASKIDA PUSULA */}
          <AskidaSirdasSection />

          {/* AYET DURAĞI: VİZYONUMUZ, MİSYONUMUZ & GAYEMİZ */}
          <section
            aria-labelledby="gayemiz-baslik"
            className="w-full relative py-20 md:py-28 border-b border-outline-variant/30 overflow-hidden"
            id="gayemiz"
          >
            {/* Ambient gold/emerald glow */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(204,167,98,0.06),_rgba(69,155,149,0.04)_50%,_transparent_75%)] blur-3xl pointer-events-none"
            />

            <div className="max-w-6xl mx-auto px-6 relative space-y-16">
              {/* Header */}
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
                  <i className="ph ph-compass text-sm"></i>
                  <span>Gayemiz • Vizyon &amp; Misyon</span>
                </span>
                <h2
                  className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface leading-tight"
                  id="gayemiz-baslik"
                  lang="tr"
                >
                  Manevi Ahlak ve İlmi Derinlikle
                  <span className="text-primary font-bold block mt-1">
                    Bütünsel İslami Rehberlik Ekosistemi
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                  Hiçbir fani zümreye dayanmadan, yalnızca Cenâb-ı Hakk&apos;ın rızasını ve kulun kalbi ferahlığını merkeze alan müstakil bir duruş.
                </p>
              </div>

              {/* 2-Column Grid: Vizyonumuz & Misyonumuz */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* VİZYONUMUZ KARTI */}
                <div className="rounded-2xl p-7 sm:p-9 bg-surface-container/60 border border-outline-variant/40 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between backdrop-blur-md shadow-lg space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-primary/40 flex items-center justify-center text-primary shadow-inner">
                        <i className="ph ph-star-four text-2xl"></i>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          Kutup Yıldızı
                        </span>
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-on-surface">
                          Vizyonumuz
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed font-light">
                      Yapay zeka teknolojisini manevi ahlak ve ilmi derinlikle harmanlayarak, tüm İslam coğrafyasında ve dünyada güvenle kullanılan birinci sınıf <strong className="text-primary font-medium">&ldquo;Bütünsel İslami Rehberlik ve Sohbet Ekosistemi&rdquo;</strong> olmaktır.
                    </p>

                    <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/30">
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                        Hiçbir grubun, cemaatin veya şahsi yapının tarafı olmadan; tamamen müstakil, cemaatsiz, sahih kaynaklara bağlı ve uçtan uca gizliliği esas alan duruşumuzla, milyonlarca insanın zihinsel karmaşalarında yönlerini bulmalarını sağlayan dijital bir kutup yıldızı olmayı hedefliyoruz.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-primary font-medium">
                    <i className="ph ph-shield-check text-base"></i>
                    <span>Müstakil • Cemaatsiz • Sahih Kaynaklara Bağlı</span>
                  </div>
                </div>

                {/* MİSYONUMUZ KARTI */}
                <div className="rounded-2xl p-7 sm:p-9 bg-surface-container/60 border border-outline-variant/40 hover:border-secondary/50 transition-all duration-300 flex flex-col justify-between backdrop-blur-md shadow-lg space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-secondary/40 flex items-center justify-center text-secondary shadow-inner">
                        <i className="ph ph-heart-straight text-2xl"></i>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                          Manevi İnşirah &amp; İstikamet
                        </span>
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-on-surface">
                          Misyonumuz
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed font-light">
                      Modern hayatın getirdiği ağır iş stresi, rızık kaygısı, ailevi imtihanlar ve manevi boşluk karşısında insanlık derin bir yalnızlığa sürüklenmiştir. <strong className="text-primary font-medium">Manevi Pusula</strong> olarak misyonumuz:
                    </p>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-300 font-light">
                      <li className="flex items-start gap-2.5">
                        <i className="ph ph-check-circle text-primary text-base shrink-0 mt-0.5"></i>
                        <span>İnsana sadece dünyevi bir varlık olmadığını, Yaratıcı&apos;nın muhatap aldığı bir <strong className="text-white font-medium">&ldquo;kul&rdquo;</strong> olduğunu hissettirmektir.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <i className="ph ph-check-circle text-primary text-base shrink-0 mt-0.5"></i>
                        <span>Yaşanan psikolojik ve zihinsel buhranları seküler avuntularla değil; takva, tevekkül, kalbi idrak ve sahih kaynakların rehberliğiyle çözüme kavuşturmaktır.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <i className="ph ph-check-circle text-primary text-base shrink-0 mt-0.5"></i>
                        <span>İnancı; dünyadan bir kaçış değil, dünyadaki krizler karşısında dimdik durmayı sağlayan manevi bir motor haline getirmektir.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <i className="ph ph-check-circle text-primary text-base shrink-0 mt-0.5"></i>
                        <span>Kullanıcılarımıza hiçbir beşeri otoriteye veya dünyevi kaygıya kul olmadan, yalnızca İlahi rızayı merkeze alarak sarsılmaz bir özgüven ve kalbi sükûnet kazandırmaktır.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-secondary font-medium">
                    <i className="ph ph-sparkle text-base"></i>
                    <span>Seküler Avuntu Değil • Kalbi İdrak ve Sükûnet</span>
                  </div>
                </div>
              </div>

              {/* AYET DURAĞI: NAHL 90 & HUCURÂT 10 */}
              <div className="bg-surface-container-low/70 rounded-2xl p-8 sm:p-12 border border-outline-variant/40 max-w-3xl mx-auto text-center space-y-6">
                <p
                  className="font-arabic text-2xl sm:text-3xl md:text-4xl text-primary/90 leading-relaxed tracking-wide"
                  dir="rtl"
                  lang="ar"
                >
                  إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ
                </p>
                <blockquote
                  className="font-heading text-lg sm:text-2xl text-on-surface font-light leading-relaxed max-w-2xl mx-auto"
                  lang="tr"
                >
                  “Şüphesiz Allah{" "}
                  <span className="text-primary font-normal">
                    adaleti, iyilik yapmayı (ihsanı)
                  </span>{" "}
                  ve akrabaya bakmayı emreder...”
                </blockquote>
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary-fixed-dim font-medium">
                  <span aria-hidden="true" className="w-6 h-[1px] bg-primary/40" />
                  <span>Nahl Suresi, 90. Âyet-i Kerime</span>
                  <span aria-hidden="true" className="w-6 h-[1px] bg-primary/40" />
                </div>
                <p
                  className="font-heading text-sm sm:text-base text-primary/80 font-light italic max-w-xl mx-auto"
                  lang="tr"
                >
                  “Mü’minler ancak kardeştirler; öyleyse kardeşlerinizin arasını
                  düzeltin...” (Hucurât Suresi, 10)
                </p>
                <p
                  className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-light leading-relaxed"
                  lang="tr"
                >
                  İlahi emrin gereği olarak; yalnız olmadığınızı hissettirmek,
                  bir din kardeşinizin dökülen kelamına şahit olmak ve gecenin
                  gecesinde bir ferahlık duasına vesile olmak için buradayız.
                </p>
              </div>
            </div>
          </section>

          {/* KAPANIŞ ÇAĞRISI — DOĞRUDAN WEB UYGULAMASI */}
          <section
            aria-labelledby="kapanis-baslik"
            className="w-full max-w-[1200px] mx-auto px-6 py-16"
          >
            <div className="bg-surface-container rounded-2xl p-8 sm:p-14 text-center flex flex-col items-center justify-center border border-outline-variant/40">
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-secondary mb-5 shadow-inner"
              >
                <i className="ph ph-chat-teardrop-dots text-2xl"></i>
              </div>
              <h2
                className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface mb-3 max-w-lg"
                id="kapanis-baslik"
                lang="tr"
              >
                Gönlün Daraldığında, Bir Selam Uzağında
              </h2>
              <p
                className="text-sm text-slate-300 max-w-md mb-8 leading-relaxed font-light"
                lang="tr"
              >
                Günün telaşında yahut gecenin sükunetinde; hiçbir peşin yargı
                olmaksızın, Kur&apos;an ve Sünnet ikliminde içini dök.
              </p>
              <Link
                aria-label="Manevi Pusula Tefekkür Odasında Hemen Sohbete Başla"
                className="inline-flex items-center gap-2.5 bg-secondary-container hover:bg-[#117a51] text-white px-7 py-3.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-lg shadow-secondary/10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                href="/"
              >
                <i
                  aria-hidden="true"
                  className="ph ph-chat-circle-dots text-lg text-secondary"
                ></i>
                <span className="animate-pulse">Tefekkür Odasında Hemen Başla</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
