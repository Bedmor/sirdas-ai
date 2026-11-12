"use client";

import React, { useEffect, useState } from "react";
import { DILIM_ADLARI, vakitAyetiSec, type DilimAnahtari, type VakitAyeti } from "@/lib/araclar/vakit-ayeti";

/** Tarayıcının yerel saatine göre değişen tek ayet kartı (Diyanet meali, mevcut korpustan). */
export function VakitAyetiKarti() {
  const [secim, setSecim] = useState<{ dilim: DilimAnahtari; ayet: VakitAyeti } | null>(null);

  useEffect(() => {
    const guncelle = () => setSecim(vakitAyetiSec(new Date()));
    guncelle();
    const t = window.setInterval(guncelle, 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section
      aria-label="Vakit ayeti"
      className="relative overflow-hidden rounded-[28px] border border-primary/30 bg-gradient-to-b from-surface-container-high/90 to-surface-container/90 p-6 sm:p-8 shadow-md"
    >
      {!secim ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-container-highest/40" />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <i aria-hidden="true" className="ph ph-sun-horizon text-sm"></i>
              {DILIM_ADLARI[secim.dilim]} · Vakit ayeti
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {secim.ayet.sure} Suresi, {secim.ayet.ayet}. {secim.ayet.ayet.includes("-") ? "ayetler" : "ayet"}
            </span>
          </div>
          <p
            lang="ar"
            dir="rtl"
            className="font-arabic text-2xl sm:text-3xl leading-[2.2] text-on-surface text-right break-words"
          >
            {secim.ayet.arapca}
          </p>
          <blockquote className="border-l-2 border-secondary/60 pl-4 text-base sm:text-lg leading-relaxed text-slate-100 font-light">
            {secim.ayet.meal}
          </blockquote>
          <p className="text-[11px] text-on-surface-variant">Meal: Diyanet İşleri Başkanlığı</p>
        </div>
      )}
    </section>
  );
}
