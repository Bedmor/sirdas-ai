"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGonulDefteri } from "./gonul-defteri-dugmesi";
import { CevapPaylasDugmesi } from "./paylas-degerlendir";
import { SesliDinleDugmesi } from "./sesli-dinle-dugmesi";
import { metniBloklaraAyir } from "@/lib/sohbet/metin-bicim";

const EYLEM =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Ekranda biçim işaretlerini (**, __) göstermeden düz metin. */
const sade = (t: string) => t.replace(/\*\*|__/g, "");

function tarihYaz(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(d);
}

/** Cihazdaki Gönül Defteri kayıtlarının listesi (okuma, kopyalama, paylaşma, dinleme, çıkarma). */
export function GonulDefteriListesi() {
  const { kayitlar, hazir, degistir } = useGonulDefteri();
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  if (!hazir) return <div className="h-40" aria-hidden="true" />;

  if (kayitlar.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container/85 p-6 text-center shadow-md">
        <i aria-hidden="true" className="ph ph-bookmark-simple text-4xl text-primary"></i>
        <p className="text-[17px] leading-relaxed text-on-surface">Defteriniz henüz boş.</p>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Sohbette gönlünüze dokunan bir cevabın altındaki “Deftere ekle” düğmesine basın; burada saklansın.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-secondary-container px-5 py-2 text-sm font-semibold text-on-secondary-container hover:bg-secondary-container/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <i aria-hidden="true" className="ph ph-chat-circle-dots text-base"></i>
          Sohbete dön
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {kayitlar.map((k) => (
        <li key={k.id} className="rounded-2xl border border-outline-variant/50 bg-surface-container/85 p-5 shadow-md">
          <p className="mb-2 text-xs font-semibold text-primary">{tarihYaz(k.eklenme)}</p>
          <div className="space-y-3 text-[16px] leading-[1.75] text-on-surface" lang="tr">
            {metniBloklaraAyir(k.metin).map((b, i) =>
              b.tur === "liste" ? (
                React.createElement(
                  b.sirali ? "ol" : "ul",
                  { key: i, className: `space-y-1 pl-5 ${b.sirali ? "list-decimal" : "list-disc"}` },
                  b.maddeler.map((m, j) => <li key={j}>{sade(m)}</li>),
                )
              ) : (
                <p key={i}>{sade(b.metin)}</p>
              ),
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-outline-variant/30 pt-2">
            <button
              type="button"
              className={EYLEM}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(k.metin);
                  setKopyalanan(k.id);
                  setTimeout(() => setKopyalanan(null), 2000);
                } catch {
                  /* pano kapalı */
                }
              }}
            >
              <i aria-hidden="true" className="ph ph-copy text-sm"></i>
              {kopyalanan === k.id ? "Kopyalandı" : "Kopyala"}
            </button>
            <CevapPaylasDugmesi metin={k.metin} className={EYLEM} />
            <SesliDinleDugmesi id={`defter-${k.id}`} metin={k.metin} className={EYLEM} />
            <button
              type="button"
              className={`${EYLEM} ml-auto hover:text-error`}
              onClick={() => degistir({ tur: "cikar", id: k.id })}
              aria-label="Bu kaydı Gönül Defterimden çıkar"
            >
              <i aria-hidden="true" className="ph ph-trash text-sm"></i>
              Çıkar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
