import React from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, Sparkles, HeartHandshake, Compass } from "lucide-react";

interface HeroProps {
  waUrl?: string;
}

export function Hero({ waUrl }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-28 md:pt-36 md:pb-36 bg-background border-b border-outline-variant/40">
      {/* Atmospheric Teal & Gold Radial Glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[680px] pointer-events-none overflow-hidden"
      >
        {/* Top radial teal radiance */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_center,_rgba(69,155,149,0.18),_rgba(18,56,53,0.08)_50%,_transparent_75%)] blur-2xl" />
        {/* Warm champagne gold focal light */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[480px] h-[280px] bg-[radial-gradient(ellipse_at_center,_rgba(204,167,98,0.14),_transparent_70%)] blur-3xl animate-aura-breathe" />
      </div>

      {/* Islamic Arch (Kemer) Vector Motif Silhouette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-start justify-center pointer-events-none opacity-[0.07]"
      >
        <svg
          viewBox="0 0 800 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-4xl h-auto text-amber-300"
        >
          {/* Outer Arch */}
          <path
            d="M 150 600 L 150 260 C 150 140, 260 50, 400 30 C 540 50, 650 140, 650 260 L 650 600"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          {/* Inner Cusped Arch */}
          <path
            d="M 220 600 L 220 280 C 220 210, 280 140, 340 100 C 370 80, 400 70, 400 70 C 400 70, 430 80, 460 100 C 520 140, 580 210, 580 280 L 580 600"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* Central Finial Rosette */}
          <circle cx="400" cy="30" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="400" cy="30" r="3" fill="currentColor" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10">
        {/* Protective Guarantee Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-md">
          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Fetva Vermez • Manevi Ayna Tutar • Çelik Kasa RAG</span>
        </div>

        {/* Primary Headline with Serene Presence */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white font-serif leading-[1.18] max-w-4xl mx-auto">
            Gönül Yaralarına Kur&apos;an, Sünnet ve{" "}
            <span className="text-amber-400 font-serif">
              Hikmet Aynası
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-foreground/85 max-w-3xl mx-auto font-light leading-relaxed pt-2">
            Modern hayatın borç, öfke, rızık kaygısı ve vesvese girdaplarında;
            fıkhi fetva vermeden, nefsin tuzaklarını deşifre eden ve sahih
            kaynaklar ışığında kalbe inşirah ve sükûnet aşılayan dijital
            manevi pusulanız.
          </p>
        </div>

        {/* Action Controls - Web & Mobile First */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {/* Primary Web Chat CTA with Multi-Layered Breathing Aura */}
          <div className="relative group w-full sm:w-auto">
            {/* Pulsating Ring Layer */}
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-2xl bg-emerald-500/30 animate-pulse-ring pointer-events-none"
            />
            {/* Ambient Breathe Glow */}
            <span
              aria-hidden="true"
              className="absolute -inset-0.5 rounded-2xl bg-amber-500/20 blur-[2px] animate-aura-breathe pointer-events-none"
            />

            <Link
              href="/"
              className="relative w-full sm:w-auto inline-flex items-center justify-center gap-3.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold text-base shadow-[0_12px_32px_-4px_rgba(5,150,105,0.45)] hover:shadow-[0_16px_36px_-2px_rgba(5,150,105,0.6)] transition-all duration-200 active:scale-[0.98] border border-emerald-400/40 hover:border-amber-400/50"
            >
              <div className="relative flex items-center justify-center">
                <Compass className="h-5 w-5 text-emerald-200 shrink-0" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-emerald-900 animate-ping" />
              </div>
              <span className="tracking-wide">Web&apos;de Dertleşmeye Başla</span>
            </Link>
          </div>

          {/* Mobile App Pill / Announcement */}
          <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl border border-emerald-900/60 bg-[#0d1411]/80 backdrop-blur-md text-foreground font-medium text-sm shadow-sm">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-slate-300">Mobil Uygulama:</span>
            <span className="text-amber-400 font-semibold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              iOS &amp; Android Çok Yakında
            </span>
          </div>

          <Link
            href="/sorumluluk-reddi"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-emerald-950/60 bg-surface-container-low/50 hover:bg-surface-container text-slate-300 hover:text-white font-medium text-sm transition-all duration-200"
          >
            <span>Fıkhi Sınırlar</span>
          </Link>
        </div>

        {/* Prestigious Highlights Bar */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-emerald-900/40 text-center">
          <div className="p-4 rounded-xl bg-[#0d1411]/40 border border-emerald-950/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-serif">
              142.000+
            </div>
            <div className="text-xs text-emerald-200/75 mt-1">
              Manevi Teskin Mesajı
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0d1411]/40 border border-emerald-950/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-serif">
              %100 Ücretsiz
            </div>
            <div className="text-xs text-emerald-200/75 mt-1">
              Askıda İnfak Modeli
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0d1411]/40 border border-emerald-950/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-serif">
              5 Süzgeç
            </div>
            <div className="text-xs text-emerald-200/75 mt-1">
              Sarsılmaz Sistem Anayasası
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0d1411]/40 border border-emerald-950/60 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-serif">
              Alo 190
            </div>
            <div className="text-xs text-emerald-200/75 mt-1">
              Fetva Koruma Kalkanı
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

