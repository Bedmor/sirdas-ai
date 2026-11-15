"use client";

import React, { useEffect, useRef, useState } from "react";
import { okunacakParcalar } from "@/lib/sohbet/sesli-okuma";

/**
 * "Sesli dinle": tarayıcının kendi konuşma özelliği (speechSynthesis, tr-TR).
 * Dış servis yok, metin cihazdan çıkmaz. Tarayıcı desteklemiyorsa düğme hiç görünmez.
 * Aynı anda tek cevap okunur; başka cevabın düğmesine basılınca önceki susar.
 */

const OLAY = "mp-sesli-okuma";

function turkceSes(): SpeechSynthesisVoice | null {
  const sesler = window.speechSynthesis.getVoices();
  return (
    sesler.find((s) => s.lang?.toLowerCase() === "tr-tr") ||
    sesler.find((s) => s.lang?.toLowerCase().startsWith("tr")) ||
    null
  );
}

export function SesliDinleDugmesi({ id, metin, className = "" }: { id: string; metin: string; className?: string }) {
  const [destek, setDestek] = useState(false);
  const [okuyor, setOkuyor] = useState(false);
  const benimki = useRef(false);

  useEffect(() => {
    setDestek(typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined");
    const baskasi = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) {
        benimki.current = false;
        setOkuyor(false);
      }
    };
    window.addEventListener(OLAY, baskasi);
    return () => {
      window.removeEventListener(OLAY, baskasi);
      if (benimki.current) window.speechSynthesis?.cancel();
    };
  }, [id]);

  if (!destek) return null;

  const durdur = () => {
    benimki.current = false;
    window.speechSynthesis.cancel();
    setOkuyor(false);
  };

  const baslat = () => {
    const ss = window.speechSynthesis;
    ss.cancel();
    window.dispatchEvent(new CustomEvent(OLAY, { detail: id }));
    const parcalar = okunacakParcalar(metin);
    if (parcalar.length === 0) return;
    const ses = turkceSes();
    benimki.current = true;
    setOkuyor(true);
    parcalar.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = "tr-TR";
      if (ses) u.voice = ses;
      u.rate = 0.95;
      if (i === parcalar.length - 1) {
        u.onend = () => {
          if (benimki.current) {
            benimki.current = false;
            setOkuyor(false);
          }
        };
      }
      u.onerror = () => {
        benimki.current = false;
        setOkuyor(false);
      };
      ss.speak(u);
    });
  };

  return (
    <button
      type="button"
      aria-pressed={okuyor}
      aria-label={okuyor ? "Sesli okumayı durdur" : "Cevabı sesli dinle"}
      title={okuyor ? "Sesli okumayı durdur" : "Cevabı sesli dinle (tarayıcınızın kendi sesiyle)"}
      onClick={okuyor ? durdur : baslat}
      className={`${className} ${okuyor ? "text-primary" : ""}`}
    >
      {okuyor ? (
        <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
        </svg>
      )}
      <span>{okuyor ? "Durdur" : "Dinle"}</span>
    </button>
  );
}
