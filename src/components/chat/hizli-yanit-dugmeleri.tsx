"use client";

import React from "react";
import type { HizliYanit } from "@/lib/sohbet/hizli-yanitlar";

/** Giriş alanının hemen üstünde, yatay kaydırılan tek dokunuşluk çipler. */
export function HizliYanitDugmeleri({
  secenekler,
  onSec,
  devreDisi,
  etiket = "Sohbeti sürdür",
}: {
  secenekler: readonly HizliYanit[];
  onSec: (metin: string) => void;
  devreDisi?: boolean;
  etiket?: string;
}) {
  if (!secenekler.length) return null;
  return (
    <nav aria-label={etiket} className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" lang="tr">
      {secenekler.map((s) => (
        <button
          key={s.etiket}
          type="button"
          disabled={devreDisi}
          onClick={() => onSec(s.gonderilecek)}
          className="inline-flex min-h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-secondary/40 bg-secondary-container/50 px-3 py-1 text-[0.8125rem] leading-tight font-medium text-on-surface hover:bg-secondary-container hover:border-primary/60 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
        >
          {s.etiket}
        </button>
      ))}
    </nav>
  );
}
