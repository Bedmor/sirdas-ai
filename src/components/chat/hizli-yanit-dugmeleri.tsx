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
    <nav aria-label="Sohbeti sürdür" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" lang="tr">
      {secenekler.map((s) => (
        <button
          key={s.etiket}
          type="button"
          disabled={devreDisi}
          onClick={() => onSec(s.gonderilecek)}
          className="inline-flex min-h-12 items-center justify-center text-center rounded-[14px] border border-secondary/40 bg-secondary-container/50 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-secondary-container hover:border-primary/60 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
        >
          {s.etiket}
        </button>
      ))}
    </nav>
  );
}
