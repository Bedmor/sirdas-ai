"use client";

import React from "react";
import type { HizliYanit } from "@/lib/sohbet/hizli-yanitlar";

/** Cevabın altında tek dokunuşla gönderilen yönlendirme düğmeleri. */
export function HizliYanitDugmeleri({
  secenekler,
  onSec,
  devreDisi,
}: {
  secenekler: HizliYanit[];
  onSec: (metin: string) => void;
  devreDisi?: boolean;
}) {
  if (!secenekler.length) return null;
  return (
    <nav aria-label="Sohbeti sürdür" className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" lang="tr">
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
