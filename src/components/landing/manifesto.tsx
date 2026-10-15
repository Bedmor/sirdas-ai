import React from "react";
import { Compass, Scale, Anchor, SunMedium, Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Manifesto() {
  const spiritualFilters = [
    {
      step: "01",
      name: "Murakabe",
      tagline: "Daimi Farkındalık",
      desc: "Allah'ın her an kulu gördüğü, işittiği ve kalbinden geçen en gizli niyetleri bildiği şuuru. Yalnızlık vehmini yıkan manevi huzur.",
      icon: Compass,
    },
    {
      step: "02",
      name: "İlahi Rıza Mizanı",
      tagline: "Kazan-Kazan Değil, Rıza Terazisi",
      desc: "Dünyevi çıkarlar, hırs veya kurnazlık değil; 'Bu adım Allah'ı razı eder mi, yoksa nefsi mi tatmin eder?' mizanıyla niyetleri berraklaştırma.",
      icon: Scale,
    },
    {
      step: "03",
      name: "Mutlak Tevekkül",
      tagline: "Sebeplere Sarılma, Neticeyi Havale",
      desc: "Kulun sebeplere canla başla sarılması, ancak neticeyi yalnızca Kadir-i Mutlak olan Allah'a havale ederek vesveseyi sükûna erdirmesi.",
      icon: Anchor,
    },
    {
      step: "04",
      name: "Çıkış Yolu ve Ümit",
      tagline: "Talâk 2-3 Hakikati",
      desc: "'Kim Allah'tan sakınırsa, Allah ona bir çıkış yolu açar.' Darlık varsa muhakkak bir genişlik vardır; bataklık ve çaresizlik hissi reddedilir.",
      icon: SunMedium,
    },
    {
      step: "05",
      name: "İmtihan Bilinci",
      tagline: "Dünya-Ahiret Dengesi",
      desc: "Dünyanın sonsuz zevk veya mülk edinme yeri değil; kulun nefsini arındırma, terbiye olma ve sonsuz ahiret yurduna hazırlanma meydanı olduğu bilinci.",
      icon: Sparkles,
    },
  ];

  return (
    <section id="manevi-suzgecler" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <Badge variant="gold" className="text-xs uppercase tracking-wider">
          Bilişsel Çekirdek Güvencesi
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-foreground">
          Her Cevabı Kuşatan 5 Sarsılmaz Manevi Süzgeç
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Sırdaş AI bir kelime üretmeden önce sistem anayasasındaki bu 5
          süzgeçten geçer. Cevabında nefsin kurnazlığına, ümitsizliğe veya
          dünyevi çıkar hırsına asla yer vermez.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spiritualFilters.map((filter) => {
          const IconComponent = filter.icon;
          return (
            <div
              key={filter.name}
              className="relative group rounded-2xl border border-border/80 bg-card p-7 shadow-sm hover:shadow-md transition-all hover:border-amber-500/40 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-serif font-extrabold text-muted-foreground/30">
                    {filter.step}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground font-serif">
                    {filter.name}
                  </h3>
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                    {filter.tagline}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {filter.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Gemini 2.5 Flash İçsel Editör Denetimli</span>
              </div>
            </div>
          );
        })}

        {/* 6th Card: Siyer Mührü */}
        <div className="relative group rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <Badge variant="gold">Zorunlu Mühür</Badge>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground font-serif">
                Siyer ve Ashab Mührü
              </h3>
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                Kuru Teori Değil, Yaşanmış Hayat
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Her cevap; Efendimiz&apos;in (s.a.v.) Taif&apos;teki duası,
                Mekke boykotundaki vakarı, Hendek açlığındaki sabrı veya
                Ashab-ı Kiram&apos;ın borç dualarıyla mühürlenir.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Sahih Hadis ve Siyer Güvencesi</span>
          </div>
        </div>
      </div>
    </section>
  );
}
