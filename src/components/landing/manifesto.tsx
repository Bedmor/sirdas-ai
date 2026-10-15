import React from "react";
import { Compass, Scale, Anchor, SunMedium, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Manifesto() {
  const spiritualFilters = [
    {
      step: "01",
      name: "Murakabe",
      tagline: "Daimi Farkındalık",
      desc: "Allah'ın her an kulu gördüğü, işittiği ve kalbinden geçen en gizli niyetleri bildiği şuuru. Yalnızlık vehmini yıkan manevi huzur.",
      icon: Compass,
      foundation: "Nisa 1 • Kaf 16 Hakikati",
    },
    {
      step: "02",
      name: "İlahi Rıza Mizanı",
      tagline: "Kazan-Kazan Değil, Rıza Terazisi",
      desc: "Dünyevi çıkarlar, hırs veya kurnazlık değil; 'Bu adım Allah'ı razı eder mi, yoksa nefsi mi tatmin eder?' mizanıyla niyetleri berraklaştırma.",
      icon: Scale,
      foundation: "Tevbe 72 • İhlas Ölçüsü",
    },
    {
      step: "03",
      name: "Mutlak Tevekkül",
      tagline: "Sebeplere Sarılma, Neticeyi Havale",
      desc: "Kulun sebeplere canla başla sarılması, ancak neticeyi yalnızca Kadir-i Mutlak olan Allah'a havale ederek vesveseyi sükûna erdirmesi.",
      icon: Anchor,
      foundation: "Âl-i İmran 159 • Sekine Kalesi",
    },
    {
      step: "04",
      name: "Çıkış Yolu ve Ümit",
      tagline: "Talâk 2-3 Hakikati",
      desc: "'Kim Allah'tan sakınırsa, Allah ona bir çıkış yolu açar.' Darlık varsa muhakkak bir genişlik vardır; bataklık ve çaresizlik hissi reddedilir.",
      icon: SunMedium,
      foundation: "İnşirah 5-6 • Müjde Pınarı",
    },
    {
      step: "05",
      name: "İmtihan Bilinci",
      tagline: "Dünya-Ahiret Dengesi",
      desc: "Dünyanın sonsuz zevk veya mülk edinme yeri değil; kulun nefsini arındırma, terbiye olma ve sonsuz ahiret yurduna hazırlanma meydanı olduğu bilinci.",
      icon: Sparkles,
      foundation: "Mülk 2 • Hikmet Terazisi",
    },
  ];

  return (
    <section id="manevi-suzgecler" className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Lighting */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(6,78,59,0.14),_rgba(217,119,6,0.06)_50%,_transparent_75%)] blur-3xl pointer-events-none"
      />

      <div className="relative text-center space-y-4 max-w-3xl mx-auto mb-20">
        <Badge variant="gold" className="text-xs uppercase tracking-wider px-3.5 py-1">
          Bilişsel Çekirdek Güvencesi
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold font-serif tracking-tight text-white leading-tight">
          Her Cevabı Kuşatan 5 Sarsılmaz Manevi Süzgeç
        </h2>
        <p className="text-base sm:text-lg text-emerald-100/75 leading-relaxed font-light">
          Sırdaş AI bir kelime üretmeden önce sistem anayasasındaki bu 5
          süzgeçten geçer. Cevabında nefsin kurnazlığına, ümitsizliğe veya
          dünyevi çıkar hırsına asla yer vermez.
        </p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {spiritualFilters.map((filter) => {
          const IconComponent = filter.icon;
          return (
            <div
              key={filter.name}
              className="relative group rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#0e1713]/90 via-[#0a110e]/90 to-[#070c09]/95 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_40px_-5px_rgba(217,119,6,0.18)] hover:border-amber-400/55 transition-all duration-300 flex flex-col justify-between backdrop-blur-md"
            >
              {/* Subtle top gold sheen highlight */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
              />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  {/* Tefekkür Icon Badge with Architectural Octagon Feel */}
                  <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 border border-amber-500/35 flex items-center justify-center text-amber-300 group-hover:scale-105 group-hover:border-amber-400/70 transition-all duration-300 shadow-inner">
                    <IconComponent className="h-6 w-6 stroke-[1.8]" />
                  </div>

                  <span className="text-3xl font-serif font-bold text-amber-500/25 group-hover:text-amber-500/40 transition-colors select-none">
                    {filter.step}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white font-serif tracking-tight">
                      {filter.name}
                    </h3>
                  </div>
                  <div className="text-xs font-semibold text-amber-400/90 tracking-wide uppercase">
                    {filter.tagline}
                  </div>
                  <p className="text-sm text-emerald-100/75 leading-relaxed font-light pt-1">
                    {filter.desc}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-emerald-900/50 text-[11px] text-emerald-300/80 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gemini 2.5 Flash İçsel Editör Denetimli</span>
                </span>
                <span className="text-amber-400/60 font-serif text-[10px]">
                  {filter.foundation}
                </span>
              </div>
            </div>
          );
        })}

        {/* 6th Card: Crowning Siyer ve Ashab Mührü (Prestigious Master Seal) */}
        <div className="relative group lg:col-span-3 rounded-2xl border-2 border-amber-500/45 bg-gradient-to-br from-[#121c16]/95 via-[#18231c]/90 to-[#0e1713]/95 p-8 sm:p-10 shadow-[0_12px_45px_-5px_rgba(217,119,6,0.22)] backdrop-blur-md overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Subtle Islamic Rosette Watermark */}
          <div
            aria-hidden="true"
            className="absolute -right-12 -bottom-12 w-64 h-64 text-amber-500/5 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,0 63,27 93,20 78,47 100,68 71,76 68,100 45,80 20,95 24,68 0,55 26,38 18,10 46,21" />
            </svg>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/45 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                <BookOpen className="h-7 w-7 stroke-[1.8]" />
              </div>
              <div>
                <Badge variant="gold" className="text-[11px] uppercase tracking-wider mb-1">
                  Zorunlu Mühür
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight">
                  Siyer ve Ashab Mührü
                </h3>
              </div>
            </div>

            <div className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
              Kuru Teori Değil, Yaşanmış Hayat
            </div>

            <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed font-light">
              Her cevap; Efendimiz&apos;in (s.a.v.) Taif&apos;teki duası,
              Mekke boykotundaki vakarı, Hendek açlığındaki sabrı veya
              Ashab-ı Kiram&apos;ın borç dualarıyla mühürlenir. Çıkmazda olan kula
              soyut felsefe değil, nübüvvet ikliminin canlı nefesi sunulur.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-end gap-3 text-right">
            <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/35 text-amber-200 text-xs font-medium flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Sahih Hadis ve Siyer Güvencesi</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 font-serif italic max-w-xs text-center sm:text-right">
              &ldquo;Ben ancak güzel ahlakı tamamlamak için gönderildim.&rdquo; (Muvatta, Hüsnü&apos;l-Huluk 8)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

