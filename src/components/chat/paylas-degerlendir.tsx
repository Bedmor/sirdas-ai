"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  cevapPaylasimMetni,
  vurguIsaretleriniTemizle,
  whatsappMetinBaglantisi,
  degerlendirmeEpostaBaglantisi,
  paylasimTamMetni,
  paylasimVerisi,
  whatsappPaylasimBaglantisi,
} from "@/lib/sohbet/paylas";

/**
 * Yan menüdeki "Paylaş" ve "Bizi değerlendir" düğmeleri.
 * Paylaşılan metin sabittir; sohbet içeriği hiçbir koşulda eklenmez.
 */

type Pencere = "paylas" | "degerlendir" | null;

const PUAN_ETIKETLERI = ["Hiç beğenmedim", "Beğenmedim", "İdare eder", "Beğendim", "Çok beğendim"];

function PaylasSimgesi({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
      />
    </svg>
  );
}

function YildizSimgesi({ className = "h-4 w-4", dolu = false }: { className?: string; dolu?: boolean }) {
  return (
    <svg aria-hidden="true" className={className} fill={dolu ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path
        strokeLinejoin="round"
        d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.11a.56.56 0 0 0 .47.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.18.56l1.28 5.38a.56.56 0 0 1-.84.61l-4.73-2.89a.56.56 0 0 0-.59 0l-4.72 2.89a.56.56 0 0 1-.84-.61l1.28-5.38a.56.56 0 0 0-.18-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.52-.44a.56.56 0 0 0 .47-.35l2.13-5.11Z"
      />
    </svg>
  );
}

function Pencereler({
  pencere,
  kapat,
  cevapMetni,
}: {
  pencere: Pencere;
  kapat: () => void;
  /** Verilirse "Cevabı paylaş" penceresi: yalnız bu cevabın metni paylaşılır */
  cevapMetni?: string;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const [puan, setPuan] = useState(0);
  const [not, setNot] = useState("");
  const kapatRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!pencere) return;
    setKopyalandi(false);
    kapatRef.current?.focus();
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [pencere, kapat]);

  if (!pencere || typeof document === "undefined") return null;

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(cevapMetni ? cevapPaylasimMetni(cevapMetni) : paylasimTamMetni());
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2500);
    } catch {
      setKopyalandi(false);
    }
  };

  const baslikId = pencere === "paylas" ? "paylas-baslik" : "degerlendir-baslik";

  // Yan menü transform taşıdığı için pencere body'ye taşınır (yoksa menü içinde sıkışır)
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4" lang="tr">
      <div aria-hidden="true" className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={kapat} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={baslikId}
        className="relative z-10 w-full max-w-sm rounded-[28px] border border-outline-variant/60 bg-surface-container-high p-5 sm:p-6 text-on-surface shadow-m3-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={baslikId} className="font-heading text-lg font-semibold text-primary-fixed">
            {pencere === "paylas" ? (cevapMetni ? "Cevabı paylaş" : "Arkadaşınla paylaş") : "Bizi değerlendir"}
          </h2>
          <button
            ref={kapatRef}
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {pencere === "paylas" ? (
          <>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {cevapMetni
                ? "Yalnızca bu cevabın metni gönderilir; senin yazdıkların paylaşılmaz."
                : "Yalnızca davet metni ve site adresi gönderilir; sohbetlerin paylaşılmaz."}
            </p>
            <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-[18px] bg-surface-container border border-outline-variant/40 px-4 py-3 text-sm leading-relaxed text-on-surface">
              {cevapMetni ? vurguIsaretleriniTemizle(cevapMetni).trim() : paylasimVerisi().text}
              <span className="mt-1 block font-medium text-primary-fixed-dim break-all">{paylasimVerisi().url}</span>
            </p>
            <div className="grid gap-2">
              <a
                href={cevapMetni ? whatsappMetinBaglantisi(cevapPaylasimMetni(cevapMetni)) : whatsappPaylasimBaglantisi()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-m3-2 hover:bg-primary-fixed-dim active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.17-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.07.9.92-2.99-.2-.31a8.2 8.2 0 1 1 6.83 3.73Zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06a6.7 6.7 0 0 1-3.32-2.9c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31 2.77 2.77 0 0 0-.86 2.06 4.8 4.8 0 0 0 1 2.55 11 11 0 0 0 4.2 3.71c1.57.68 2.18.73 2.96.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z" />
                </svg>
                WhatsApp ile gönder
              </a>
              <button
                type="button"
                onClick={kopyala}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container text-sm font-medium text-on-surface hover:bg-surface-container-highest active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                <span aria-live="polite">
                  {cevapMetni
                    ? kopyalandi ? "Metin kopyalandı" : "Metni kopyala"
                    : kopyalandi ? "Bağlantı kopyalandı" : "Bağlantıyı kopyala"}
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Manevi Pusula sana nasıl geldi? Puanın ve notun, Görüş &amp; Öneri e-postasıyla bize ulaşır.
            </p>
            <div role="radiogroup" aria-label="Puanın" className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={puan === n}
                  aria-label={`${n} yıldız: ${PUAN_ETIKETLERI[n - 1]}`}
                  onClick={() => setPuan(n)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    n <= puan ? "text-primary" : "text-on-surface-variant/60 hover:text-primary/80"
                  }`}
                >
                  <YildizSimgesi className="h-8 w-8" dolu={n <= puan} />
                </button>
              ))}
            </div>
            <p className="min-h-5 text-center text-sm text-on-surface-variant" aria-live="polite">
              {puan > 0 ? PUAN_ETIKETLERI[puan - 1] : "Bir yıldız seç"}
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs text-on-surface-variant">Eklemek istediğin bir not (isteğe bağlı)</span>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-[18px] border border-outline-variant/60 bg-surface-container px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
                placeholder="Neyi sevdin, neyi geliştirelim?"
              />
            </label>
            <a
              href={puan > 0 ? degerlendirmeEpostaBaglantisi(puan, not) : undefined}
              aria-disabled={puan === 0}
              onClick={(e) => {
                if (puan === 0) {
                  e.preventDefault();
                  return;
                }
                setTimeout(kapat, 300);
              }}
              className={`flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold shadow-m3-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                puan > 0
                  ? "bg-primary text-on-primary hover:bg-primary-fixed-dim active:scale-[0.98]"
                  : "bg-primary/30 text-on-primary/70 cursor-not-allowed"
              }`}
            >
              E-postayla gönder
            </a>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function PaylasDegerlendir({ dar = false }: { dar?: boolean }) {
  const [pencere, setPencere] = useState<Pencere>(null);
  const kapat = React.useCallback(() => setPencere(null), []);

  const paylas = async () => {
    const veri = paylasimVerisi();
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(veri);
        return;
      } catch (err) {
        // Kullanıcı paylaşım penceresini kapattıysa bir şey yapma
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    setPencere("paylas");
  };

  if (dar) {
    return (
      <>
        <button
          type="button"
          onClick={paylas}
          aria-label="Arkadaşınla paylaş"
          title="Arkadaşınla paylaş"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container border border-outline-variant/40 text-primary hover:text-primary-fixed-dim transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <PaylasSimgesi />
        </button>
        <button
          type="button"
          onClick={() => setPencere("degerlendir")}
          aria-label="Bizi değerlendir"
          title="Bizi değerlendir"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container border border-outline-variant/40 text-primary hover:text-primary-fixed-dim transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <YildizSimgesi />
        </button>
        <Pencereler pencere={pencere} kapat={kapat} />
      </>
    );
  }

  const genis =
    "flex min-h-10 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 px-2 py-2 text-xs font-medium text-on-surface hover:text-primary transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <>
      <div className="flex items-center gap-2" lang="tr">
        <button type="button" onClick={paylas} className={`${genis} flex-none px-3`}>
          <PaylasSimgesi className="h-4 w-4 text-primary" />
          <span>Paylaş</span>
        </button>
        <button type="button" onClick={() => setPencere("degerlendir")} className={`${genis} flex-1`}>
          <YildizSimgesi className="h-4 w-4 text-primary" />
          <span>Bizi değerlendir</span>
        </button>
      </div>
      <Pencereler pencere={pencere} kapat={kapat} />
    </>
  );
}

/** Cevabın altındaki "Paylaş": yalnız o cevabın metni, kullanıcı kendisi dokununca. */
export function CevapPaylasDugmesi({ metin, className }: { metin: string; className?: string }) {
  const [pencere, setPencere] = useState<Pencere>(null);
  const kapat = React.useCallback(() => setPencere(null), []);
  const paylas = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Manevi Pusula", text: cevapPaylasimMetni(metin) });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    setPencere("paylas");
  };
  return (
    <>
      <button type="button" onClick={paylas} aria-label="Bu cevabı paylaş" className={className}>
        <PaylasSimgesi className="h-3.5 w-3.5" />
        <span>Paylaş</span>
      </button>
      <Pencereler pencere={pencere} kapat={kapat} cevapMetni={metin} />
    </>
  );
}
