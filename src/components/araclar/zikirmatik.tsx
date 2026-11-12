"use client";

import React, { useEffect, useState } from "react";

const ZIKIRLER = [
  { id: "subhanallah", ad: "Sübhanallah", arapca: "سبحان الله" },
  { id: "elhamdulillah", ad: "Elhamdülillah", arapca: "الحمد لله" },
  { id: "allahuekber", ad: "Allahu Ekber", arapca: "الله أكبر" },
  { id: "tevhid", ad: "Lâ ilâhe illallah", arapca: "لا إله إلا الله" },
  { id: "istigfar", ad: "Estağfirullah", arapca: "أستغفر الله" },
  { id: "serbest", ad: "Serbest sayım", arapca: "" },
] as const;

type ZikirId = (typeof ZIKIRLER)[number]["id"];
const HEDEFLER = [33, 99, 100, 0] as const; // 0 = hedefsiz (serbest)

type Durum = { secili: ZikirId; hedef: number; sayilar: Partial<Record<ZikirId, number>> };

const ANAHTAR = "manevi-pusula:zikirmatik:v1";
const BASLANGIC: Durum = { secili: "subhanallah", hedef: 33, sayilar: {} };

function oku(): Durum {
  try {
    const ham = window.localStorage.getItem(ANAHTAR);
    if (!ham) return BASLANGIC;
    const d = JSON.parse(ham) as Partial<Durum>;
    const secili = ZIKIRLER.some((z) => z.id === d.secili) ? (d.secili as ZikirId) : BASLANGIC.secili;
    const hedef = HEDEFLER.includes(d.hedef as (typeof HEDEFLER)[number]) ? (d.hedef as number) : 33;
    const sayilar: Durum["sayilar"] = {};
    for (const z of ZIKIRLER) {
      const n = Number(d.sayilar?.[z.id]);
      if (Number.isFinite(n) && n > 0) sayilar[z.id] = Math.floor(n);
    }
    return { secili, hedef, sayilar };
  } catch {
    return BASLANGIC;
  }
}

function yaz(d: Durum) {
  try {
    window.localStorage.setItem(ANAHTAR, JSON.stringify(d));
  } catch {
    // Tarayıcı kaydı kapalıysa sayım yalnızca bu oturumda kalır.
  }
}

function titret(desen: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(desen);
  } catch {
    // Titreşim desteklenmiyor.
  }
}

export function Zikirmatik() {
  const [durum, setDurum] = useState<Durum>(BASLANGIC);
  const [yuklendi, setYuklendi] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  useEffect(() => {
    setDurum(oku());
    setYuklendi(true);
  }, []);

  useEffect(() => {
    if (yuklendi) yaz(durum);
  }, [durum, yuklendi]);

  const sayi = durum.sayilar[durum.secili] ?? 0;
  const zikir = ZIKIRLER.find((z) => z.id === durum.secili) ?? ZIKIRLER[0];
  const hedef = durum.hedef;
  const turdaki = hedef > 0 ? sayi % hedef : sayi;
  const tur = hedef > 0 ? Math.floor(sayi / hedef) : 0;
  const oran = hedef > 0 ? (sayi > 0 && turdaki === 0 ? 1 : turdaki / hedef) : 0;

  const arttir = () => {
    const yeni = sayi + 1;
    const hedefTamam = hedef > 0 && yeni % hedef === 0;
    titret(hedefTamam ? [80, 60, 80, 60, 160] : 15);
    setTamamlandi(hedefTamam);
    setDurum((d) => ({
      ...d,
      sayilar: { ...d.sayilar, [d.secili]: (d.sayilar[d.secili] ?? 0) + 1 },
    }));
  };

  const sifirla = () => {
    if (sayi === 0) return;
    if (!window.confirm(`${zikir.ad} sayacı sıfırlansın mı?`)) return;
    setTamamlandi(false);
    setDurum((d) => {
      const sayilar = { ...d.sayilar };
      delete sayilar[d.secili];
      return { ...d, sayilar };
    });
  };

  const R = 46;
  const CEVRE = 2 * Math.PI * R;

  return (
    <div className="space-y-6">
      {/* Zikir seçimi */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Zikir</span>
        <div className="flex flex-wrap gap-2">
          {ZIKIRLER.map((z) => {
            const aktif = z.id === durum.secili;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => {
                  setTamamlandi(false);
                  setDurum((d) => ({ ...d, secili: z.id }));
                }}
                aria-pressed={aktif}
                className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  aktif
                    ? "bg-secondary-container text-on-secondary-container border-secondary/40"
                    : "bg-surface-container text-slate-200 border-outline-variant/50 hover:border-primary/50"
                }`}
              >
                {z.ad}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hedef seçimi */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Hedef</span>
        <div className="flex flex-wrap gap-2">
          {HEDEFLER.map((h) => {
            const aktif = h === durum.hedef;
            return (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setTamamlandi(false);
                  setDurum((d) => ({ ...d, hedef: h }));
                }}
                aria-pressed={aktif}
                className={`min-w-[64px] px-3.5 py-2 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  aktif
                    ? "bg-primary/15 text-primary border-primary/60"
                    : "bg-surface-container text-slate-200 border-outline-variant/50 hover:border-primary/50"
                }`}
              >
                {h === 0 ? "Serbest" : h}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sayaç */}
      <div className="rounded-[28px] border border-outline-variant/50 bg-surface-container/80 p-5 sm:p-8 shadow-md">
        <button
          type="button"
          onClick={arttir}
          aria-label={`${zikir.ad} için bir say. Şu anki sayı ${sayi}`}
          className="group relative mx-auto flex aspect-square w-full max-w-[320px] select-none items-center justify-center rounded-full bg-surface-container-high border border-outline-variant/60 shadow-inner transition-transform duration-100 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60 [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
        >
          <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-outline-variant/40" />
            {hedef > 0 && (
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CEVRE}
                strokeDashoffset={CEVRE * (1 - oran)}
                className="text-secondary transition-[stroke-dashoffset] duration-200"
              />
            )}
          </svg>
          <span className="relative flex flex-col items-center gap-1 px-6 text-center">
            {zikir.arapca && (
              <span lang="ar" dir="rtl" className="font-arabic text-2xl sm:text-3xl text-primary leading-snug">
                {zikir.arapca}
              </span>
            )}
            <span className="font-heading text-6xl sm:text-7xl font-semibold tabular-nums text-on-surface">
              {yuklendi ? sayi : 0}
            </span>
            <span className="text-xs text-on-surface-variant">
              {hedef > 0 ? `Bu turda ${sayi > 0 && turdaki === 0 ? hedef : turdaki} / ${hedef}` : "Dokunarak sayın"}
            </span>
          </span>
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300 min-h-[1.25rem]" aria-live="polite">
            {tamamlandi ? (
              <span className="text-secondary font-semibold">Hedef tamamlandı ({tur}. tur).</span>
            ) : hedef > 0 && tur > 0 ? (
              <span>Tamamlanan tur: {tur}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={sifirla}
            disabled={sayi === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-outline-variant/60 text-slate-200 hover:border-red-400/60 hover:text-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <i aria-hidden="true" className="ph ph-arrow-counter-clockwise text-sm"></i>
            Sıfırla
          </button>
        </div>
      </div>

      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        Sayımınız yalnızca bu cihazdaki tarayıcıda saklanır; sunucuya gönderilmez. Tarayıcı verilerini
        temizlerseniz sayım da silinir. Titreşim, destekleyen telefonlarda çalışır.
      </p>
    </div>
  );
}
