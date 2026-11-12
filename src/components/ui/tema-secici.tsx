"use client";

import React, { useEffect, useState } from "react";
import { TEMA_ANAHTAR as ANAHTAR } from "@/lib/gorunum-betikleri";

/** Görünüm temaları: gece (varsayılan koyu yeşil), gündüz (açık krem), yüksek zıtlık (siyah zemin). */
export type TemaAdi = "gece" | "gunduz" | "yuksek";
export const TEMA_VARSAYILAN: TemaAdi = "gece";

export const TEMALAR: { ad: TemaAdi; etiket: string; zemin: string; vurgu: string }[] = [
  { ad: "gece", etiket: "Gece", zemin: "#0a1c1e", vurgu: "#cca762" },
  { ad: "gunduz", etiket: "Gündüz", zemin: "#f6f1e6", vurgu: "#7a5a14" },
  { ad: "yuksek", etiket: "Yüksek zıtlık", zemin: "#000000", vurgu: "#ffd60a" },
];

function okuTema(): TemaAdi {
  if (typeof document === "undefined") return TEMA_VARSAYILAN;
  const t = document.documentElement.getAttribute("data-theme");
  return t === "gunduz" || t === "yuksek" ? t : TEMA_VARSAYILAN;
}

function uygulaTema(t: TemaAdi) {
  if (t === TEMA_VARSAYILAN) document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(ANAHTAR, t);
  } catch {
    /* depolama kapalıysa yalnızca bu oturumda geçerli */
  }
  window.dispatchEvent(new CustomEvent("mp-tema", { detail: t }));
}

function useTema(): [TemaAdi, (t: TemaAdi) => void] {
  const [tema, setTema] = useState<TemaAdi>(TEMA_VARSAYILAN);
  useEffect(() => {
    setTema(okuTema());
    const dinle = () => setTema(okuTema());
    window.addEventListener("mp-tema", dinle);
    return () => window.removeEventListener("mp-tema", dinle);
  }, []);
  return [
    tema,
    (t: TemaAdi) => {
      uygulaTema(t);
      setTema(t);
    },
  ];
}

/**
 * Görünüm seçici: 3 renk yuvarlağı. "tam" düzende adlar yuvarlağın altında yazılı,
 * "kucuk" düzende yalnız yuvarlaklar (ad, ipucu ve ekran okuyucu etiketi olarak).
 */
export function TemaSecici({
  duzen = "tam",
  className = "",
}: {
  duzen?: "tam" | "kucuk";
  className?: string;
}) {
  const [tema, sec] = useTema();
  const kucuk = duzen === "kucuk";

  return (
    <div
      role="radiogroup"
      aria-label="Görünüm (renk teması)"
      className={`flex items-start ${kucuk ? "gap-1" : "gap-2 justify-between"} ${className}`}
    >
      {TEMALAR.map((t) => {
        const secili = tema === t.ad;
        return (
          <button
            key={t.ad}
            type="button"
            role="radio"
            aria-checked={secili}
            aria-label={`${t.etiket} teması`}
            title={`${t.etiket} teması`}
            onClick={() => sec(t.ad)}
            className={`group flex flex-col items-center gap-1 rounded-2xl ${
              kucuk ? "p-[4px]" : "min-w-[64px] flex-1 px-1 py-1.5"
            } text-on-surface hover:bg-surface-container-highest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer`}
          >
            <span
              aria-hidden="true"
              className={`relative flex items-center justify-center rounded-full ${
                kucuk ? "h-[28px] w-[28px]" : "h-[40px] w-[40px]"
              } ${secili ? "ring-[3px] ring-primary ring-offset-2 ring-offset-surface" : "ring-1 ring-outline"}`}
              style={{ background: t.zemin }}
            >
              <span
                className={`${kucuk ? "h-[10px] w-[10px]" : "h-[14px] w-[14px]"} rounded-full`}
                style={{ background: t.vurgu }}
              />
            </span>
            {!kucuk && (
              <span className={`text-xs leading-tight text-center ${secili ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
                {t.etiket}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
