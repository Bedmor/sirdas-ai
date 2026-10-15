import React from "react";
import Link from "next/link";
import { ShieldCheck, PhoneCall } from "lucide-react";

interface HeroProps {
  waUrl: string;
}

export function Hero({ waUrl }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-emerald-950/80 via-emerald-950/40 to-background border-b border-border/50">
      {/* Subtle Islamic geometric ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-emerald-800/10 to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-sm animate-in fade-in">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span>Fetva Vermez • Manevi Ayna Tutar • Çelik Kasa RAG</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-serif leading-[1.15] drop-shadow-sm">
          Gönül Yaralarına Kur&apos;an, Sünnet ve{" "}
          <span className="text-amber-400 decoration-amber-500/40 underline decoration-wavy decoration-1">
            Hikmet Aynası
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-emerald-100/80 max-w-3xl mx-auto font-light leading-relaxed">
          Modern hayatın borç, öfke, rızık kaygısı ve vesvese girdaplarında;
          fıkhi fetva vermeden, nefsin tuzaklarını deşifre eden ve Halis
          Aydemir sohbetleri ışığında kulun kalbine sekine fısıldayan dijital
          sırdaşınız.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all active:scale-[0.98] border border-emerald-500/40"
          >
            <PhoneCall className="h-5 w-5 text-emerald-200" />
            <span>Sırdaş ile Konuş (WhatsApp)</span>
          </a>

          <Link
            href="/sorumluluk-reddi"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm text-foreground font-medium text-base hover:bg-muted/60 transition-all"
          >
            <span>Manevi Sınırlar ve Fıkhi Çerçeve</span>
          </Link>
        </div>

        {/* Quick Meta Stats / Highlights */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-emerald-900/40 text-center">
          <div className="p-3">
            <div className="text-2xl font-bold text-amber-400 font-serif">
              142.000+
            </div>
            <div className="text-xs text-emerald-200/70 mt-0.5">
              Manevi Teskin Mesajı
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-bold text-amber-400 font-serif">
              %100 Ücretsiz
            </div>
            <div className="text-xs text-emerald-200/70 mt-0.5">
              Askıda İnfak Modeli
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-bold text-amber-400 font-serif">
              5 Süzgeç
            </div>
            <div className="text-xs text-emerald-200/70 mt-0.5">
              Sarsılmaz Sistem Anayasası
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-bold text-amber-400 font-serif">
              Alo 190
            </div>
            <div className="text-xs text-emerald-200/70 mt-0.5">
              Fetva Koruma Kalkanı
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
