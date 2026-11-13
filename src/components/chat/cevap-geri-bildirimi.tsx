"use client";

import React from "react";

/**
 * Kalite kontrol kapısı: her asistan cevabının altında "Faydalı oldu / Olmadı".
 *
 * Projede geri bildirim tablosu veya uç noktası yok (mevcut "Görüş" yolu
 * e-postadır). Bu yüzden işaret yalnızca bu cihazdaki sohbet kaydında tutulur;
 * "Olmadı" denince mevcut e-posta yolu hazır doldurulmuş olarak sunulur.
 * Sunucuda kalıcı ve anonim sayım için veritabanında bir alan gerekir.
 */

export type GeriBildirim = "faydali" | "olmadi";

const GORUS_EPOSTA = "adnan.kus@hotmail.com";

export function gorusEpostaBaglantisi(msg: { id: string; createdAt: string; content: string }): string {
  const konu = "Manevi Pusula - Cevap faydalı olmadı";
  const govde =
    `Mesaj Tarihi: ${msg.createdAt}\nMesaj ID: ${msg.id}\nYanıt Kesiti:\n${msg.content.slice(0, 300)}...\n\n` +
    "--- Neyin eksik kaldığını veya nasıl daha iyi olabileceğini yazabilirsiniz ---\n";
  return `mailto:${GORUS_EPOSTA}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;
}

export function CevapGeriBildirimi({
  deger,
  onDegis,
  epostaHref,
}: {
  deger?: GeriBildirim;
  onDegis: (deger: GeriBildirim | undefined) => void;
  epostaHref: string;
}) {
  const dugme = (secili: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      secili
        ? "border-primary bg-primary/15 text-on-surface"
        : "border-outline-variant bg-surface-container/60 text-on-surface hover:bg-surface-container-highest hover:text-on-surface"
    }`;

  return (
    <div className="space-y-2" lang="tr">
      <div role="group" aria-label="Bu cevap faydalı oldu mu?" className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-on-surface-variant mr-1">Bu cevap faydalı oldu mu?</span>
        <button
          type="button"
          aria-pressed={deger === "faydali"}
          onClick={() => onDegis(deger === "faydali" ? undefined : "faydali")}
          className={dugme(deger === "faydali")}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Faydalı oldu
        </button>
        <button
          type="button"
          aria-pressed={deger === "olmadi"}
          onClick={() => onDegis(deger === "olmadi" ? undefined : "olmadi")}
          className={dugme(deger === "olmadi")}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Olmadı
        </button>
      </div>
      <div aria-live="polite">
        {deger === "faydali" && (
          <p className="text-[13px] text-on-surface-variant">Teşekkürler, Allah razı olsun.</p>
        )}
        {deger === "olmadi" && (
          <p className="text-[13px] leading-relaxed text-on-surface-variant">
            Teşekkürler. İstersen neyin eksik kaldığını{" "}
            <a href={epostaHref} className="font-semibold text-primary underline underline-offset-4">
              e-postayla iletebilirsin
            </a>
            ; cevaplar bu bildirimlerle iyileştirilir. Aşağıdan da yeniden sorabilirsin.
          </p>
        )}
      </div>
    </div>
  );
}
