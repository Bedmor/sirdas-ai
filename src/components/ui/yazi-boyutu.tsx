"use client";

import React, { useEffect, useState } from "react";

/** Yazı boyutu kademeleri: 0 = 16px, 1 = 18px (varsayılan), 2 = 20px, 3 = 22px */
export const YAZI_KADEME_SAYISI = 4;
export const YAZI_VARSAYILAN = 1;
const ANAHTAR = "mp-yazi-boyutu";

/** Sayfa boyanmadan önce <head> içinde çalışır; tercih edilen kademeyi hemen uygular. */
export const yaziBoyutuBetigi = `(function(){try{var k=localStorage.getItem("${ANAHTAR}");if(k!==null&&/^[0-${YAZI_KADEME_SAYISI - 1}]$/.test(k)){document.documentElement.setAttribute("data-yazi",k);}}catch(e){}})();`;

function okuKademe(): number {
  if (typeof document === "undefined") return YAZI_VARSAYILAN;
  const ham = document.documentElement.getAttribute("data-yazi");
  if (ham === null) return YAZI_VARSAYILAN;
  const v = Number(ham);
  return Number.isInteger(v) && v >= 0 && v < YAZI_KADEME_SAYISI ? v : YAZI_VARSAYILAN;
}

export function YaziBoyutuDugmesi({ className = "" }: { className?: string }) {
  const [kademe, setKademe] = useState<number>(YAZI_VARSAYILAN);

  useEffect(() => {
    setKademe(okuKademe());
  }, []);

  const uygula = (yeni: number) => {
    const k = Math.min(YAZI_KADEME_SAYISI - 1, Math.max(0, yeni));
    document.documentElement.setAttribute("data-yazi", String(k));
    try {
      localStorage.setItem(ANAHTAR, String(k));
    } catch {
      /* depolama kapalıysa yalnızca bu oturumda geçerli */
    }
    setKademe(k);
  };

  const dugme =
    "inline-flex h-[36px] min-w-[36px] items-center justify-center rounded-full px-[6px] font-semibold text-on-surface hover:text-primary hover:bg-surface-container-highest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

  return (
    <div
      role="group"
      aria-label="Yazı boyutu"
      className={`flex shrink-0 items-center rounded-full bg-surface-container/90 border border-outline-variant/50 ${className}`}
    >
      <button
        type="button"
        aria-label="Yazı boyutunu küçült"
        title="Yazı boyutunu küçült"
        className={`${dugme} text-[16px]`}
        disabled={kademe <= 0}
        onClick={() => uygula(kademe - 1)}
      >
        A<span aria-hidden="true">−</span>
      </button>
      <button
        type="button"
        aria-label="Yazı boyutunu büyüt"
        title="Yazı boyutunu büyüt"
        className={`${dugme} text-[18px]`}
        disabled={kademe >= YAZI_KADEME_SAYISI - 1}
        onClick={() => uygula(kademe + 1)}
      >
        A<span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
